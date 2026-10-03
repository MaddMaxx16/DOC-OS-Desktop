import { Component } from 'react'

export default class RuntimeErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    return (
      <main className="runtime-error-screen" role="alert">
        <span>DOC OS DESKTOP</span>
        <strong>Startup error</strong>
        <p>{error?.message || 'An unknown runtime error occurred.'}</p>
        <small>Send this message to Chet and we can trace it directly.</small>
      </main>
    )
  }
}
