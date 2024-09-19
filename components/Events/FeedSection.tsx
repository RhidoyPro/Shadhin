import React from "react";
import UploadCard from "./UploadCard";
import EventCard from "../Shared/EventCard";
import { getEventsByState } from "@/data/events";

type FeedSectionProps = {
  activeState: string;
};

const FeedSection = async ({ activeState }: FeedSectionProps) => {
  const events = await getEventsByState(activeState);

  return (
    <section className="flex-[2.5] flex flex-col gap-3">
      <UploadCard />
      {events?.length ? (
        events.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <p className="text-center text-lg text-gray-600 mt-4">
          No events found for{" "}
          <span className="text-gray-800 font-semibold capitalize">
            {activeState}
          </span>
        </p>
      )}
    </section>
  );
};

export default FeedSection;
