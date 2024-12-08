import LoginForm from "@/features/Form/ui/LoginForm";
import styles from "./page.module.scss";

export default async function LoginPage() {
  return (
    <div className={styles.background}>
      <h1 className="text-5xl bg-gradient-to-r from-[#9153cb] to-[#e1d6d2] bg-clip-text text-transparent pt-14 mb-0 pl-[120px]">
        BNR - Be Natural Rare
      </h1>
      <LoginForm />
    </div>
  );
}
