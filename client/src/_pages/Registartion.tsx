import RegistrationForm from "@/features/Registration/ui/RegistrationForm";
import { AuthShell } from "@/shared/ui/auth-shell";

const RegistrationPage = () => (
  <AuthShell title="Создать аккаунт" description="Сохраните свою музыкальную историю и соберите коллекцию BNR.">
    <RegistrationForm />
  </AuthShell>
);

export default RegistrationPage;
