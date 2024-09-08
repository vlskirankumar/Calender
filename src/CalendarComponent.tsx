import React, { ChangeEvent, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ClassName, TileArgs } from 'react-calendar/dist/cjs/shared/types';

type EventType = ('office' | 'holiday' | 'wfh' | 'ooo') | undefined | null;

interface Event {
    date: string;
    type: EventType;
};

const CalendarComponent = () => {
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedEventType, setSelectedEventType] = useState<EventType>();
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [events, setEvents] = useState<Event[]>([]);

    const today = useMemo(() => new Date(), []);

    const firstDate = useMemo(() => {
        const retDate = new Date(today);
        if (retDate.getDay() !== 6) {
            retDate.setDate(retDate.getDate() - retDate.getDay());
        } else {
            retDate.setDate(retDate.getDate() + 1);
        }
        retDate.setDate(retDate.getDate() - 83);
        return retDate;
    }, [today]);

    const lastDate = useMemo(() => {
        const retDate = new Date(today);
        if (retDate.getDay() !== 6) {
            retDate.setDate(retDate.getDate() - retDate.getDay());
        } else {
            retDate.setDate(retDate.getDate() + 1);
        }
        return retDate;
    }, [today]);

    const handleDateClick = (date: Date, event: React.MouseEvent<HTMLButtonElement>) => {
        setShowDialog(true);
        setSelectedDate(date.toDateString());
        const existEvent = events.find(e => e.date === date.toDateString());
        if (existEvent) {
            setSelectedEventType(existEvent.type);
        }
    };

    const getDateStyle = ({ activeStartDate, date, view }: TileArgs): ClassName => {
        if (view === "month") {
            const event = events.find(e => e.date === date.toDateString());
            if (event) {
                return event.type;
            }
        }
        return;
    };

    const handleEventTypeChange = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedEventType(changeEvent.target.value as EventType);
    };

    const handleOkClick = () => {
        setShowDialog(false);
        const updatedEvents = events.filter(e => e.date !== selectedDate);
        if (selectedEventType) {
            updatedEvents.push({ date: selectedDate, type: selectedEventType });
        }
        setEvents([...updatedEvents]);
    };

    const handleCancelClick = () => {
        setShowDialog(false);
    };

    const handleLoadData = (changeEvent: React.ChangeEvent<HTMLTextAreaElement>) => {
        try {
            const data = JSON.parse(changeEvent.target.value);
            setEvents(data);
        } catch {
            alert("Invalid JSON");
        }
    };

    return (
        <div>
            <h1>Calendar</h1>
            <div style={{ display: "flex" }}>
                <div>
                    <Calendar onClickDay={handleDateClick} maxDate={lastDate} minDate={firstDate} tileClassName={getDateStyle} />
                    <textarea rows={5} cols={45} value={JSON.stringify(events)} onChange={handleLoadData}></textarea>
                </div>
                <div>
                    {/* <Calendar onClickDay={handleDateClick} /> */}
                </div>
            </div>
            
            {
                showDialog &&
                <div style={{ position: "fixed", height: "100%", width: "100%", backgroundColor: "white", top: 0, left: 0 }}>
                    <div style={{ margin: "auto", marginTop: "30vh" }}>
                        <p>{selectedDate}</p>
                        <select value={selectedEventType ?? ""} onChange={handleEventTypeChange}>
                            <option value="">---</option>
                            <option value="office">Office</option>
                            <option value="holiday">Holiday</option>
                            <option value="ooo">OOO</option>
                            <option value="wfh">Approved WFH</option>
                        </select>
                        <input type='button' value="Ok" onClick={handleOkClick} />
                        <input type='button' value="Cancel" onClick={handleCancelClick} />
                    </div>
                </div>
            }
        </div>
    );
};

export default CalendarComponent;
