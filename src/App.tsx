import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@aws-amplify/ui-react";
import outputs from "../amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import "./App.css";

// Import components
import LandingPage from "./components/LandingPage";
import CityView from "./components/CityView";
import ChannelView from "./components/ChannelView";
import CreateCity from "./components/CreateCity";
import CreateChannel from "./components/CreateChannel";
import CreatePost from "./components/CreatePost";

Amplify.configure(outputs);

function App() {
  return (
    <ThemeProvider>
      <Authenticator.Provider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/city/:citySlug" element={<CityView />} />
              <Route
                path="/city/:citySlug/channel/:channelSlug"
                element={<ChannelView />}
              />
              <Route path="/create-city" element={<CreateCity />} />
              <Route
                path="/city/:citySlug/create-channel"
                element={<CreateChannel />}
              />
              <Route
                path="/city/:citySlug/create-post"
                element={<CreatePost />}
              />
              <Route
                path="/city/:citySlug/channel/:channelSlug/create-post"
                element={<CreatePost />}
              />
            </Routes>
          </div>
        </Router>
      </Authenticator.Provider>
    </ThemeProvider>
  );
}

export default App;
