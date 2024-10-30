import { Button } from "@/components/shadcn/ui/button";
import logo from "/eventhub-logo.png";
import { useNavigate } from "react-router-dom";
import LogoutButton from "@/components/LogoutButton.tsx";

const HostHomePage = () => {
    const navigate = useNavigate();

    const buttonTextFormat = "text-3xl mx-6 px-6 py-4 font-alatsi";

    return (
        <div className="bg-[#08081d] min-h-screen w-screen flex flex-col items-center justify-center text-white">
            <div className="flex flex-col items-center">
                <img
                    src={logo}
                    alt="EventHub Logo"
                    className="py-2 max-w-[800px] w-full cursor-pointer"
                    onClick={() => navigate("/")}
                />
                <div className="text-center">
                    <h1 className="text-5xl font-bold font-alatsi mt-4 inline-block">Host Management</h1>
                    <div className="border-t border-gray-600 mt-4 w-full max-w-[calc(100%+5rem)] mx-auto"></div>
                </div>
            </div>

            <div className="flex flex-col items-center mt-4 space-y-6">
                <Button
                    onClick={() => navigate("/host/create")}
                    variant="ghost"
                    className={buttonTextFormat}
                >
                    Create Event
                </Button>
                <Button
                    onClick={() => navigate("/host/manage")}
                    variant="ghost"
                    className={buttonTextFormat}
                >
                    Manage Event
                </Button>
                <div className="w-48 border-t border-gray-600 my-4"></div>
                <LogoutButton/>
            </div>
        </div>
    );
};

export default HostHomePage;
