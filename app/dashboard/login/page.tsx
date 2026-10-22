import { LoginForm } from "@/components/dashboard/login-form";

export default function LoginPage() {
  return (
    <div className="dash-login">
      <div className="dash-login-card">
        <span className="dash-brand-chip">Hearth & Hue</span>
        <h1>Welcome back.</h1>
        <p>Store dashboard login. There is no public signup.</p>
        <LoginForm/>
      </div>
    </div>
  );
}
