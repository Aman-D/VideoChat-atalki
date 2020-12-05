import "./App.css";
import { Route, Switch } from "react-router-dom";
import Client from "./pages/Client";
import Owner from "./pages/Owner";

function App() {
  return (
    <div className="App">
      <Switch>
        <Route path="/client" component={Client} />
        <Route path="/owner" component={Owner} />
      </Switch>
    </div>
  );
}

export default App;
