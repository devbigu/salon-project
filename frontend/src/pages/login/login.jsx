import { useState, useEffect } from "react";

const slides = [
    {
        name: "Crypto Dashboard",
        desc: "Monitor wallets, transactions and balance flow in real time.",
        img: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1781850427/Screenshot_2026-06-19_115541_ldpf56.png",
    },
    {
        name: "Investment Suite",
        desc: "Track your portfolio, profits and active investment plans.",
        img: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1781850427/Screenshot_2026-06-19_115557_rt4rvi.png",
    },
    {
        name: "Finance Overview",
        desc: "At-a-glance summary of all your financial data and activity.",
        img: "https://res.cloudinary.com/dzrg0utcm/image/upload/v1781850427/Screenshot_2026-06-19_115617_iuxjev.png",
    },
];

/* ─── Shared Logo ─── */
function Logo() {
    return (
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
                <span className="text-gray-900">miri</span>
                <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">soft</span>
            </span>
        </div>
    );
}

/* ─── Shared Right Panel ─── */
function RightPanel({ slide, fading, changeTo }) {
    return (
        <div className="hidden lg:flex flex-col w-[56%] h-full bg-gradient-to-br from-slate-100 via-violet-50 to-indigo-100 relative overflow-hidden">
            {/* Decorations */}
            <svg className="absolute top-5 right-7 opacity-25 pointer-events-none" width="70" height="70" viewBox="0 0 70 70">
                {[...Array(4)].map((_, r) => [...Array(4)].map((_, c) => (
                    <circle key={`${r}-${c}`} cx={c * 18 + 9} cy={r * 18 + 9} r="2.5" fill="#7c3aed" />
                )))}
            </svg>
            <svg className="absolute top-6 right-3 opacity-20 w-10 pointer-events-none" viewBox="0 0 40 100" fill="none">
                <path d="M20 0 Q35 25 20 50 Q5 75 20 100" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <svg className="absolute top-14 right-20 opacity-30 pointer-events-none" width="12" height="12" viewBox="0 0 12 12">
                <line x1="6" y1="0" x2="6" y2="12" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="6" x2="12" y2="6" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg className="absolute top-8 right-36 opacity-20 pointer-events-none" width="10" height="10" viewBox="0 0 10 10">
                <line x1="5" y1="0" x2="5" y2="10" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="5" x2="10" y2="5" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-28 left-6 w-14 h-14 rounded-full border-4 border-violet-300/40 pointer-events-none" />
            <svg className="absolute bottom-20 right-8 opacity-20 pointer-events-none" width="55" height="55" viewBox="0 0 55 55">
                {[...Array(3)].map((_, r) => [...Array(3)].map((_, c) => (
                    <circle key={`${r}-${c}`} cx={c * 20 + 10} cy={r * 20 + 10} r="2" fill="#6366f1" />
                )))}
            </svg>

            {/* Slide image */}
            <div className="flex-1 flex items-center justify-center px-8 pt-8 pb-3 min-h-0">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300"
                    style={{ opacity: fading ? 0 : 1 }}>
                    <img src={slides[slide].img} alt={slides[slide].name}
                        className="w-full h-full object-cover object-top" draggable={false} />
                </div>
            </div>

            {/* Label */}
            <div className="text-center px-8 pb-1 transition-opacity duration-300" style={{ opacity: fading ? 0 : 1 }}>
                <h3 className="text-base font-extrabold text-gray-800">{slides[slide].name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{slides[slide].desc}</p>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-2 py-4">
                {slides.map((_, i) => (
                    <button key={i} onClick={() => changeTo(i)}
                        className={`rounded-full transition-all duration-300 ${i === slide
                            ? "w-6 h-2.5 bg-gradient-to-r from-violet-600 to-indigo-500"
                            : "w-2.5 h-2.5 bg-gray-300 hover:bg-violet-400"
                            }`} />
                ))}
            </div>
        </div>
    );
}

/* ─── Eye icon ─── */
function EyeIcon({ open }) {
    return open
        ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>;
}

/* ─── Social Buttons ─── */
function SocialButtons() {
    return (
        <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-1.5 border border-blue-100 hover:bg-blue-50 rounded-xl py-2 text-xs font-medium text-blue-600 transition-colors">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                </svg>
                Facebook
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-100 hover:bg-gray-50 rounded-xl py-2 text-xs font-medium text-gray-600 transition-colors">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
            </button>
        </div>
    );
}

/* ─── Footer links ─── */
function Footer() {
    return (
        <div className="flex flex-wrap gap-4 pt-4 mt-auto">
            {["Terms & Condition", "Privacy Policy", "Help"].map(l => (
                <a key={l} href="#" className="text-[10px] text-gray-400 hover:text-violet-500 transition-colors">{l}</a>
            ))}
            {/* <button className="text-[10px] text-gray-400 hover:text-violet-500 flex items-center gap-0.5">
                English
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button> */}
        </div>
    );
}

/* ═══════════════════════════════
   SIGN IN PAGE
═══════════════════════════════ */
function SignIn({ onGoRegister, slide, fading, changeTo }) {
    const [email, setEmail] = useState("");
    const [passcode, setPasscode] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (!email || !passcode) { setError("Please fill in both fields."); return; }
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden font-sans bg-white">
            {/* Left */}
            <div className="flex flex-col w-full lg:w-[44%] h-full px-10 py-6 flex-shrink-0">
                <Logo />

                <div className="flex flex-col justify-center flex-1 max-w-xs w-full mx-auto">
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-0.5">Sign In</h1>
                    <p className="text-xs text-gray-500 mb-6">
                        Access the <span className="text-violet-600 font-medium">Mirisoft</span> panel using your email and passcode.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-700">Email or Username</label>
                                <a href="#" className="text-xs font-medium text-violet-600 hover:text-indigo-500">Need Help?</a>
                            </div>
                            <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email address or username"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-gray-50" />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-xs font-semibold text-gray-700">Passcode</label>
                                <a href="#" className="text-xs font-medium text-violet-600 hover:text-indigo-500">Forgot Code?</a>
                            </div>
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} value={passcode} onChange={e => setPasscode(e.target.value)}
                                    placeholder="Enter your passcode"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-gray-50" />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-500">
                                    <EyeIcon open={showPass} />
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 text-white font-bold rounded-xl py-2.5 text-sm shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2">
                            {loading
                                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Signing in…</>
                                : "Sign in"}
                        </button>
                    </form>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        New on our platform?{" "}
                        <button onClick={onGoRegister} className="text-violet-600 font-semibold hover:text-indigo-500 underline-offset-2 hover:underline">
                            Create an account
                        </button>
                    </p>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <SocialButtons />

                    <p className="text-xs text-gray-400 mt-4 text-center">
                        Don't have an account?{" "}
                        <button onClick={onGoRegister} className="text-violet-600 font-semibold hover:text-indigo-500">Try 15 days free</button>
                    </p>
                </div>

                <Footer />
            </div>

            {/* Right */}
            <RightPanel slide={slide} fading={fading} changeTo={changeTo} />
        </div>
    );
}

/* ═══════════════════════════════
   REGISTER PAGE
═══════════════════════════════ */
function Register({ onGoSignIn, slide, fading, changeTo }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [passcode, setPasscode] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");
        if (!name || !email || !passcode) { setError("Please fill in all fields."); return; }
        if (!agreed) { setError("You must agree to the Privacy Policy & Terms."); return; }
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    return (
        <div className="h-screen w-screen flex overflow-hidden font-sans bg-white">
            {/* Left */}
            <div className="flex flex-col w-full lg:w-[44%] h-full px-10 py-6 flex-shrink-0">
                <Logo />

                <div className="flex flex-col justify-center flex-1 max-w-xs w-full mx-auto">
                    <h1 className="text-2xl font-extrabold text-gray-900 mb-0.5">Register</h1>
                    <p className="text-xs text-gray-500 mb-6">
                        Create New <span className="text-violet-600 font-medium">Mirisoft</span> Account
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-gray-50" />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Email or Username</label>
                            <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email address or username"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-gray-50" />
                        </div>

                        {/* Passcode */}
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Passcode</label>
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} value={passcode} onChange={e => setPasscode(e.target.value)}
                                    placeholder="Enter your passcode"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-700 placeholder-gray-300 outline-none focus:ring-2 focus:ring-violet-400 focus:border-violet-400 transition bg-gray-50" />
                                <button type="button" onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-violet-500">
                                    <EyeIcon open={showPass} />
                                </button>
                            </div>
                        </div>

                        {/* Agree checkbox */}
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <div onClick={() => setAgreed(!agreed)}
                                className={`w-4 h-4 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${agreed ? "bg-violet-600 border-violet-600" : "border-gray-300 bg-white"}`}>
                                {agreed && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-xs text-gray-600">
                                I agree to Mirisoft{" "}
                                <a href="#" className="text-violet-600 font-medium hover:underline">Privacy Policy</a>
                                {" & "}
                                <a href="#" className="text-violet-600 font-medium hover:underline">Terms.</a>
                            </span>
                        </label>

                        {error && <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</p>}

                        <button type="submit" disabled={loading}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-700 hover:to-indigo-600 text-white font-bold rounded-xl py-2.5 text-sm shadow-lg shadow-violet-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2">
                            {loading
                                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Creating account…</>
                                : "Register"}
                        </button>
                    </form>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        Already have an account?{" "}
                        <button onClick={onGoSignIn} className="text-violet-600 font-semibold hover:text-indigo-500 underline-offset-2 hover:underline">
                            Sign in instead
                        </button>
                    </p>

                    <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <SocialButtons />
                </div>

                <Footer />
            </div>

            {/* Right — same slider */}
            <RightPanel slide={slide} fading={fading} changeTo={changeTo} />
        </div>
    );
}

/* ═══════════════════════════════
   ROOT — manages page + slider
═══════════════════════════════ */
export default function App() {
    const [page, setPage] = useState("signin"); // "signin" | "register"
    const [slide, setSlide] = useState(0);
    const [fading, setFading] = useState(false);
    const [pageAnim, setPageAnim] = useState(false);

    // Auto-advance slides
    useEffect(() => {
        const id = setInterval(() => changeTo((slide + 1) % slides.length), 4000);
        return () => clearInterval(id);
    }, [slide]);

    const changeTo = (i) => {
        setFading(true);
        setTimeout(() => { setSlide(i); setFading(false); }, 280);
    };

    const navigate = (target) => {
        setPageAnim(true);
        setTimeout(() => { setPage(target); setPageAnim(false); }, 200);
    };

    const sharedProps = { slide, fading, changeTo };

    return (
        <div style={{ opacity: pageAnim ? 0 : 1, transition: "opacity 0.2s ease" }}>
            {page === "signin"
                ? <SignIn   {...sharedProps} onGoRegister={() => navigate("register")} />
                : <Register {...sharedProps} onGoSignIn={() => navigate("signin")} />
            }
        </div>
    );
}