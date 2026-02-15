export interface DayPlan {
    day: string;
    date: string;
    title: string;
    description: string;
}

export default function SightseeingSection({ day }: { day: DayPlan }) {
    return (
        <div className="p-4 border rounded-lg bg-white shadow">
            <h3 className="font-semibold">
                {day.day}: {day.date}
            </h3>
            <p className="text-sm font-medium mt-1">{day.title}</p>
            <p className="text-sm text-gray-600 mt-1">{day.description}</p>
            <button className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">
                Change Day
            </button>
        </div>
    );
}
