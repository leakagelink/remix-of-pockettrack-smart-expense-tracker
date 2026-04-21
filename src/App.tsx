import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { initializeAdMob } from "./components/AdMob";
import { installGlobalCrashLogger } from "./lib/crashLogger";

// Install a global crash logger BEFORE anything else so we never miss a startup crash.
installGlobalCrashLogger();

// Initialize AdMob when app starts (deferred + isolated so a native crash cannot kill the app).
if (typeof window !== "undefined") {
  // Defer to next tick so React can mount even if AdMob throws synchronously.
  setTimeout(() => {
    initializeAdMob().catch((err) => {
      // Already logged inside, but double-guard.
      console.error("[AdMob] init outer catch:", err);
    });
  }, 0);
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
