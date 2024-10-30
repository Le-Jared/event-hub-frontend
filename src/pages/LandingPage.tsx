import { Button } from "@/components/shadcn/ui/button.tsx";
import logo from "/eventhub-logo.png";
import React, { useState } from "react";
import HostLoginPage from "./host/HostLoginPage.tsx";
import HostRegisterPage from "./host/HostRegisterPage.tsx";
import JoinEvent from "@/pages/JoinEvent.tsx";

const LandingPage = () => {
  const [optionSelected, setOptionSelected] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [showHostButtons, setShowHostButtons] = useState(false); // New state variable

  const div = `bg-[#08081d] h-screen w-screen flex flex-col items-center justify-center transition-all duration-300 `;
  const buttonTextFormat = "text-3xl mx-8 px-8 py-6 font-alatsi";
  const TRANSITION_DURATION = 300;

  /**
   * Handles the button click event.
   *
   * @param {string} option - The option selected by the user.
   * @return {void}
   */
  const handleButtonClick = (option: string) => {
    // If the same option is selected, close it
    if (optionSelected === option) {
      setTransitioning(true); // Start transition
      setTimeout(() => {
        setOptionSelected(null);
        setTransitioning(false); // End transition
      }, TRANSITION_DURATION); // Wait for transition duration before closing
      return;
    }

    // Set the transitioning state to true to indicate that a transition is in progress
    setTransitioning(true);

    try {
      // After a delay of the transition duration, update the selected option and reset the transitioning state
      setTimeout(() => {
        setOptionSelected(option);
        setTransitioning(false);
      }, TRANSITION_DURATION);
    } catch (error) {
      // Log and handle any errors that occur during the transition
      console.error(`Error in handleButtonClick: ${error}`);
      setTransitioning(false);
    }
  };

  /**
   * Renders the content based on the selected option.
   *
   * @return {JSX.Element | null} The rendered content or null if no option is selected.
   */
  const renderContent = () => {
    // Using a switch statement to render different components based on the selected option.
    // Returns null if no option is selected.
    switch (optionSelected) {
      case "login":
        // Render the HostLoginPage component if the option is "login".
        return <HostLoginPage />;
      case "register":
        // Render the HostRegisterPage component if the option is "register".
        return <HostRegisterPage />;
      case "join event":
          return <JoinEvent/>;
      default:
        // Return null if no option is selected.
        return null;
    }
  };

  return (
      <div className={div}>
        {/* Host Button positioned at the top right */}
        <Button
            onClick={() => setShowHostButtons(!showHostButtons)} // Toggle host buttons
            variant="ghost"
            className={`absolute top-4 right-4 text-2xl px-4 py-2 bg-white text-black rounded`}
        >
          Host
        </Button>

        <div className={`flex flex-col transition-all duration-300 ${optionSelected === null ? " " : " "}`}>
          <img
              src={logo}
              alt="EventHub Logo"
              className={`py-2 max-w-[800px] w-full`}
              onClick={() => {
                handleButtonClick("");
              }}
          />

          <div className={`text-white `}>
            <div className="py-4 text-center">
              <Button
                  onClick={() => handleButtonClick("join event")}
                  variant="ghost"
                  className={buttonTextFormat}
              >
                Join Event
              </Button>

              {showHostButtons && ( // Conditionally render login and register buttons
                  <>
                  <Button
                      onClick={() => handleButtonClick("login")}
                      variant="ghost"
                      className={buttonTextFormat}
                  >
                    Host Login
                  </Button>
                  <Button
                      variant="ghost"
                      className={buttonTextFormat}
                      onClick={() => handleButtonClick("register")}
                  >
                    Host Register
                  </Button>
                  {/* <Button
              variant="ghost"
              className={buttonTextFormat}
              onClick={() => handleButtonClick("watch")}
            >
              Join Watch Party
            </Button> */}
                  </>
                  )}
                  </div>
                </div>
                </div>

                <div
                className={`items-center transition-opacity duration-300 ${
                transitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {renderContent()}
            </div>
          </div>
          );
          };

          export default LandingPage;
