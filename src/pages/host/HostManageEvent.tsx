import { useNavigate } from "react-router-dom";
import logo from "/eventhub-logo.png";
import { useEffect, useState } from "react";
import * as apiClient from "@/utils/api-client";
import { Button } from "@/components/shadcn/ui/button";
import { ArrowLeft } from "lucide-react";

export interface Event {
  code: string;
  createdDate: string;
  id: string;
  password: string;
  scheduledDate: string;
  scheduledTime: string;
}

const HostManageEvent = () => {
  const [events, setEvents] = useState<Array<Event>>([]);
  useEffect(() => {
    getEvents();
  }, []);

  const navigate = useNavigate();

  const getEvents = async () => {
    //hardcoded userId
    const response = await apiClient.getEvents("1");
    setEvents(response.data);
  }

  const columnCss = "px-2 py-2";

  function eventDetails(event: Event, key: number) {
    return (
      <tr key={key}>
        <td>{event.code}</td> 
        <td>{event.createdDate}</td> 
        <td>{event.scheduledDate}</td> 
        <td>{event.scheduledTime}</td>
        <td><Button onClick={() => navigate(`/event/${event.code}`)}>Manage</Button></td>
      </tr>
    )
  };

  return (
    <div className="bg-[#08081d] min-h-screen w-screen flex flex-col items-center justify-center text-white container relative">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="absolute top-4 left-4 text-white hover:text-gray-300"
        onClick={() => navigate("/host")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="flex flex-col items-center">
        <img
          src={logo}
          alt="EventHub Logo"
          className="py-2 max-w-[800px] w-full cursor-pointer"
          onClick={() => navigate("/host")}
        />
      </div>
      <div className="text-center py-8">
        <h1 className="text-5xl font-bold font-alatsi mt-4 inline-block">Events List</h1>
        <div className="border-t border-gray-600 mt-4 w-full max-w-[calc(100%+5rem)] mx-auto"></div>
      </div>
      <div>
        <table className="text-center text-lg">
          <thead className="border-b">
            <tr>
              <th className={columnCss}>Event Code</th>
              <th className={columnCss}>Created Date</th>
              <th className={columnCss}>Scheduled Date</th>
              <th className={columnCss}>Scheduled Time</th>
              <th className={columnCss}>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.length > 0 
              ? events.map((event: Event, key: number) => {
                  return eventDetails(event, key)
                })
              : <tr><td colSpan={5}>No events found</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HostManageEvent;