import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }

    render() {
        if (this.state.hasError) return <div className="p-8 text-center"><h1>Something went wrong.</h1></div>;
        return this.props.children;
    }
}
