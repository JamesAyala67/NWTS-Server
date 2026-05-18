import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          // Default structural styling
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-950 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg p-4 text-base border",
          description: "group-[.toast]:text-slate-500 text-sm mt-1",
          actionButton:
            "group-[.toast]:bg-[#4a5a4a] group-[.toast]:text-white hover:group-[.toast]:bg-[#3a4a3f]",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-500",

          // Here is where we force your custom colors with high specificity!
          success:
            "group-[.toaster]:bg-[#e4ebd8] group-[.toaster]:text-[#4a5a4a] group-[.toaster]:border-[#c5d4b5]",
          error:
            "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800 group-[.toaster]:border-red-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
