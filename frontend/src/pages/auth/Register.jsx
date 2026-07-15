import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Head from "@/layout/head/Head";
import AuthFooter from "./AuthFooter";
import {
  Block,
  BlockContent,
  BlockDes,
  BlockHead,
  BlockTitle,
  Button,
  Icon,
  PreviewCard,
} from "@/components/Component";
import { Alert, Spinner } from "reactstrap";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const MirisoftLogo = "/mirisoftlogo.png";

const Register = () => {
  const [passState, setPassState] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorVal, setError] = useState("");
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { register: createAccount } = useAuth();

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError("");

    try {
      await createAccount({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
      });
      navigate("/", { replace: true });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to create the account.");
    } finally {
      setLoading(false);
    }
  };
  return <>
    <Head title="Register" />
      <Block className="nk-block-middle nk-auth-body  wide-xs">
        <div className="brand-logo pb-4 text-center">
          <Link to={`/`} className="logo-link">
            <img className="logo-light logo-img logo-img-lg" src={MirisoftLogo} alt="MiriSoft" />
            <img className="logo-dark logo-img logo-img-lg" src={MirisoftLogo} alt="MiriSoft" />
          </Link>
        </div>
        <PreviewCard className="card-bordered" bodyClass="card-inner-lg">
          <BlockHead>
            <BlockContent>
              <BlockTitle tag="h4">Register</BlockTitle>
              <BlockDes>
                <p>Create a new salon SaaS administrator account.</p>
              </BlockDes>
            </BlockContent>
          </BlockHead>
          <form className="is-alter" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Name
              </label>
              <div className="form-control-wrap">
                <input
                  type="text"
                  id="name"
                  autoComplete="name"
                  disabled={loading}
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                  placeholder="Enter your name"
                  className="form-control-lg form-control" />
                {errors.name && <p className="invalid">{errors.name.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <div className="form-label-group">
                <label className="form-label" htmlFor="default-01">
                  Email
                </label>
              </div>
              <div className="form-control-wrap">
                <input
                  type="email"
                  id="default-01"
                  autoComplete="email"
                  disabled={loading}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  className="form-control-lg form-control"
                  placeholder="Enter your email address" />
                {errors.email && <p className="invalid">{errors.email.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone-number">
                Phone Number
              </label>
              <div className="form-control-wrap">
                <input
                  type="tel"
                  id="phone-number"
                  inputMode="numeric"
                  autoComplete="tel"
                  disabled={loading}
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Enter a valid 10-digit phone number",
                    },
                  })}
                  className="form-control-lg form-control"
                  placeholder="Enter 10-digit phone number"
                />
                {errors.phoneNumber && <p className="invalid">{errors.phoneNumber.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <div className="form-label-group">
                <label className="form-label" htmlFor="password">
                  Passcode
                </label>
              </div>
              <div className="form-control-wrap">
                <a
                  href="#password"
                  onClick={(ev) => {
                    ev.preventDefault();
                    setPassState(!passState);
                  }}
                  className={`form-icon lg form-icon-right passcode-switch ${passState ? "is-hidden" : "is-shown"}`}
                >
                  <Icon name="eye" className="passcode-icon icon-show"></Icon>

                  <Icon name="eye-off" className="passcode-icon icon-hide"></Icon>
                </a>
                <input
                  type={passState ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  disabled={loading}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  placeholder="Enter your passcode"
                  className={`form-control-lg form-control ${passState ? "is-hidden" : "is-shown"}`} />
                {errors.password && <span className="invalid">{errors.password.message}</span>}
              </div>
            </div>
            <div className="form-group">
              <div className="custom-control custom-control-xs custom-checkbox">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="terms"
                  disabled={loading}
                  {...register("terms", { required: "You must accept the terms and privacy policy" })}
                />
                <label className="custom-control-label" htmlFor="terms">
                  I agree to the <Link to="/pages/terms-policy">Terms and Privacy Policy</Link>.
                </label>
              </div>
              {errors.terms && <span className="invalid d-block">{errors.terms.message}</span>}
            </div>
            {errorVal && (
              <div className="mb-3">
                <Alert color="danger" className="alert-icon">
                  <Icon name="alert-circle" /> {errorVal}
                </Alert>
              </div>
            )}
            <div className="form-group">
              <Button type="submit" color="primary" size="lg" className="btn-block" disabled={loading}>
                {loading ? <Spinner size="sm" color="light" /> : "Register"}
              </Button>
            </div>
          </form>
          <div className="form-note-s2 text-center pt-4">
            {" "}
            Already have an account?{" "}
            <Link to={`/auth-login`}>
              <strong>Sign in instead</strong>
            </Link>
          </div>
          <div className="text-center pt-4 pb-3">
            <h6 className="overline-title overline-title-sap">
              <span>OR</span>
            </h6>
          </div>
          <ul className="nav justify-center gx-8">
            <li className="nav-item">
              <a
                className="nav-link"
                href="#socials"
                onClick={(ev) => {
                  ev.preventDefault();
                }}
              >
                Facebook
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                href="#socials"
                onClick={(ev) => {
                  ev.preventDefault();
                }}
              >
                Google
              </a>
            </li>
          </ul>
        </PreviewCard>
      </Block>
      <AuthFooter />
  </>;
};
export default Register;
