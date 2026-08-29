import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { ProfileSetupPage } from "@/views/shop/ProfileSetupPage"

export default function Page() {
  return (
    <ProtectedRoute roles={["retailer"]} allowPasswordSetup>
      <ProfileSetupPage />
    </ProtectedRoute>
  )
}
