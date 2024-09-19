import { getAllEvents } from "@/data/events";
import React from "react";
import { EventsDataTable } from "./data-table";

const AllEventsPage = async () => {
  const events = await getAllEvents();
  return (
    <div>
      <h1 className="text-3xl font-semibold text-primary">Events</h1>
      <div>
        <EventsDataTable events={events || []} />
      </div>
    </div>
  );
};

export default AllEventsPage;
