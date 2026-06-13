import { type Request, type Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema.js";
import { UserModel } from "../users/user.model.js";
import { comparePass, hashPass } from "../../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt.js";
import { verifyRefreshToken } from "../../utils/jwt.js";

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.safeParse(req.body);

        if (!data.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: data.error.flatten().fieldErrors
            })
        }

        const { name, email, password, phone_number } = data.data

        const existingUser = await UserModel.findByEmail(email);
        const existingPhone = await UserModel.findByPhoneNumber(phone_number);

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "user with this email already exists"
            })
        }

        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: "user with this phone number already exists"
            })
        }

        const hashpassword = await hashPass(password)

        const newUser = await UserModel.create({
            name,
            email,
            phone_number,
            passwordHash: hashpassword,
            role: "SUPER_ADMIN"
        })

        const tokenPayload = {
            userId: newUser.id,
            role: newUser.role,
            ...(newUser.salonId ? { salonId: newUser.salonId } : {}),
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: newUser,
                accessToken,

            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })

    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const data = loginSchema.safeParse(req.body)
        if (!data.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid input data",
                errors: data.error.flatten().fieldErrors,
            });
        }

        const { email, password } = data.data;
        const user = await UserModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await comparePass(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const tokenPayload = {
            userId: user.id,
            role: user.role,
            ...(user.salonId ? { salonId: user.salonId } : {}),
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        const { passwordHash, ...safeUser } = user;

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });


        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: safeUser,
                accessToken,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server Error"
        })
    }
}

export const me = async (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated user",
    user: req.user,
  });
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = verifyRefreshToken(refreshToken) as {
      userId: string;
      salonId?: string;
      role: string;
    };

    const accessToken = generateAccessToken({
      userId: decoded.userId,
      role: decoded.role,
      ...(decoded.salonId ? { salonId: decoded.salonId } : {}),
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};


export const logout = async (req: Request, res: Response)=>{
    res.clearCookie("refreshToken", {
        httpOnly: true, 
        secure: false, 
        sameSite: "lax"
    })

    return res.status(200).json({
        success: true,
        message: "Logged Out successfully"
    })

}
