import {Component,type ReactNode} from 'react';

/** A failed optional scene bundle must not take down the room controls. */
export class SceneBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() {
    if(this.state.failed) return <div className="scene-error" role="alert">
      <p>The 3D view couldn’t open. Reload the page to try again.</p>
      <button type="button" onClick={()=>location.reload()}>Reload page</button>
    </div>;
    return this.props.children;
  }
}
