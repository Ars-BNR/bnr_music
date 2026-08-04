import LoginForm from "@/features/Form/ui/LoginForm";
import { AuthShell } from "@/shared/ui/auth-shell";

const LoginPage = () => (
  <AuthShell title="Войти в BNR" description="Продолжите слушать музыку и управляйте своей коллекцией.">
    <LoginForm />
  </AuthShell>
);

export default LoginPage;
