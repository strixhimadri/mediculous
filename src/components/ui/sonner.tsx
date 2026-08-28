import { Toaster as Sonner } from "sonner"

function Toaster() {
  return (
    <Sonner
      theme="light"
      toastOptions={{
        classNames: {
          toast: "glass !border-line !text-ink",
        },
      }}
    />
  )
}

export { Toaster }
