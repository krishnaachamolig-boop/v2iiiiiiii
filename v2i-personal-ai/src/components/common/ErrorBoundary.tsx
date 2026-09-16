import React from "react";

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-lg font-semibold text-slate-200">Something went wrong</p>
          <p className="max-w-sm text-sm text-slate-400">{this.state.error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-full bg-neon-cyan/20 px-4 py-2 text-sm text-neon-cyan hover:bg-neon-cyan/30"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
