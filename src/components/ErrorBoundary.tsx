import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.operationType && parsed.authInfo) {
            errorMessage = `Firestore Permission Error: ${parsed.operationType} on ${parsed.path}. Please check your access rights.`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#0f0f0f] border border-white/10 rounded-[32px] p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">System Error</h2>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs font-bold text-white/20 uppercase tracking-widest mb-2">Error Details</p>
              <p className="text-sm text-white/60 leading-relaxed break-words">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Restart Application
            </button>
            {isFirestoreError && (
              <p className="mt-6 text-[10px] text-white/20 uppercase tracking-widest leading-relaxed">
                If this persists, contact your laboratory administrator to verify your security clearance.
              </p>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
