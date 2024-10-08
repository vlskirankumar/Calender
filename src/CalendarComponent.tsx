import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { ClassName, TileArgs } from 'react-calendar/dist/cjs/shared/types';

type EventType = ('office' | 'holiday' | 'wfh' | 'ooo') | undefined | null;

interface Event {
    date: string;
    type: EventType;
};

const CalendarComponent = () => {
    const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem("attendancePantryApiKey"));
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedEventType, setSelectedEventType] = useState<EventType>();
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [events, setEvents] = useState<Event[]>(JSON.parse(localStorage.getItem("attendanceData") ?? "[]"));
    const [noAPI, setNoAPI] = useState<boolean>(false);

    const today = useMemo(() => new Date(new Date().toDateString()), []);

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
        // if (retDate.getDay() !== 6) {
        //     retDate.setDate(retDate.getDate() - retDate.getDay());
        // } else {
        //     retDate.setDate(retDate.getDate() + 1);
        // }
        return retDate;
    }, [today]);

    const lastWeekEnd = useMemo(() => {
        const retDate = new Date(today);
        if (retDate.getDay() !== 6) {
            retDate.setDate(retDate.getDate() - retDate.getDay());
        }
        return retDate;
    }, [today]);

    const fetchData = async () => {
        if (apiKey) {
            try {
                let resp = await fetch(`https://getpantry.cloud/apiv1/pantry/${apiKey}/basket/attendance`, { method: "GET" });
                let j = await resp.json();
                const eventsData = j.data as Event[];
                if (eventsData && eventsData.length > 0) {
                    setEvents(eventsData.filter(e => {
                        const dt = new Date(e.date);
                        return (dt <= lastDate) && (dt >= firstDate)
                            && (dt.getDay() !== 6) && (dt.getDay() !== 0)
                    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
                    setNoAPI(false);
                }
            } catch (err) {
                alert(err);
                setNoAPI(true);
            }
        }
    };

    useEffect(() => {
        localStorage.setItem("attendanceData", JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        fetchData();
    }, [apiKey, firstDate, lastDate]);

    const saveToPantry = async () => {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const raw = JSON.stringify({ "data": events });
        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        } as RequestInit;
        try {
            await fetch("https://getpantry.cloud/apiv1/pantry/" + apiKey + "/basket/attendance", requestOptions);
            alert("Saved Successfully!");
            setNoAPI(false);
        } catch (err) {
            alert(err);
            setNoAPI(true);
        }
    };

    const downloadJson = async () => {
        const json = JSON.stringify(events, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const href = URL.createObjectURL(blob);

        // create "a" HTLM element with href to file
        const link = document.createElement("a");
        link.href = href;
        link.download = "attendance.json";
        document.body.appendChild(link);
        link.click();

        // clean up "a" element & remove ObjectURL
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    const loadJson = async (changeEvent: React.ChangeEvent<HTMLInputElement>) => {
        let reader = new FileReader();
        reader.onload = (event) => {
            try {
                let fileObj = JSON.parse(event.target?.result?.toString() ?? "[]") as Event[];
                if (fileObj && Array.isArray(fileObj) && fileObj.length > 0 && fileObj[0].date !== undefined) {
                    setEvents(fileObj);
                } else {
                    alert("inValid Json Data file provided!");
                }
            } catch (err) {
                alert("inValid Json Data file provided!");
                alert(err);
            }

        };

        reader.onerror = (event) => {
            alert("inValid Json Data file provided!");
            alert(event.target?.error);
        };

        if (changeEvent.target.files && changeEvent.target.files.length > 0) {
            try {
                reader.readAsText(changeEvent.target.files[0]);
            } catch (err) {
                alert("inValid Json Data file provided!");
                alert(err);
            }
        }
    };

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
        setEvents([...updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())]);
    };

    const handleCancelClick = () => {
        setShowDialog(false);
    };

    const disableWeekends = ({ date }: TileArgs) => {
        const day = date.getDay();
        return day === 0 || day === 6; // 0 for Sunday, 6 for Saturday
    };

    const officeDays = useMemo(() => {
        return events.filter(e => e.type === "office" && new Date(e.date) < lastWeekEnd).length;
    }, [events, lastWeekEnd]);

    const oooDays = useMemo(() => {
        return events.filter(e => (e.type === "holiday" || e.type === "ooo") && new Date(e.date) < lastWeekEnd).length;
    }, [events, lastWeekEnd]);

    const wfhDays = useMemo(() => {
        return events.filter(e => e.type === "wfh" && new Date(e.date) < lastWeekEnd).length;
    }, [events, lastWeekEnd]);

    const percetage = useMemo(() => ((100 * (officeDays + oooDays)) / (60 - wfhDays)).toFixed(2), [officeDays, oooDays, wfhDays]);

    const predictWeeks = useMemo(() => {
        if (events && events.length > 0) {
            const excessDays = (Number(percetage) - 60) * (60 / 100);
            if (excessDays > 0) {
                return ((new Date(events[Math.round(excessDays)].date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 7)).toFixed(2);
            } else {
                return 0;
            }
        } else {
            return 0;
        }
    }, [events, percetage, firstDate]);

    if (apiKey) {
        return <div>
            <h1>Calendar</h1>
            <div style={{ display: "flex", flexDirection: "column" }}>
                <div>
                    <Calendar onClickDay={handleDateClick} maxDate={lastDate} minDate={firstDate}
                        tileClassName={getDateStyle} tileDisabled={disableWeekends} />
                    <br />
                    <input type='button' value="Save" onClick={saveToPantry} />
                    <br />
                    <br />
                    <table border={2}>
                        <thead>
                            <tr>
                                <th>In Office</th>
                                <th>Leave + Holidays</th>
                                <th>Approved WFH + Comp Leave</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{officeDays}</td>
                                <td>{oooDays}</td>
                                <td>{wfhDays}</td>
                                <td>{percetage + " %"}</td>
                            </tr>
                        </tbody>
                    </table>
                    <br />
                    <table border={2}>
                        <tbody>
                            <tr>
                                <th>How many weeks I can WFH ?</th>
                                <td>{predictWeeks + " weeks"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div>
                    {
                        noAPI &&
                        <div>
                            <input type='button' value="Download Data" onClick={downloadJson} />
                            <input type='file' onChange={loadJson} />
                        </div>
                    }
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
    } else {
        return <div style={{ margin: "auto", marginTop: "30vh" }}>
            <input size={32} onChange={e => {
                const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[4][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
                if (regex.test(e.target.value)) {
                    setApiKey(e.target.value);
                    localStorage.setItem("attendancePantryApiKey", e.target.value);
                }
            }} placeholder='Please Enter Pantry API Key!' />
        </div>
    }
};

export default CalendarComponent;
