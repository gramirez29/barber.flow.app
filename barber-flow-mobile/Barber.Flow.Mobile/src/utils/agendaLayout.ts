import type { Appointment, AppointmentStatus } from "../features/appointments/appointments.types";

/**
 * Pure logic for the hourly day agenda (mirrors barber-flow-web `agendaLayout.ts`).
 * One 30-minute spot per appointment, 8:00–20:00. All times are "minutes since midnight".
 */
export const AGENDA = {
	SLOT_MINUTES: 30,
	START_HOUR: 8,
	END_HOUR: 20,
	SLOT_HEIGHT_PX: 52,
	GUTTER_PX: 52,
} as const;

export const AGENDA_FLAG_STORAGE_KEY = "barber-flow-flag-agenda-day-view";

export interface AgendaRange {
	startMinutes: number;
	endMinutes: number;
}

export interface LaidOutAppointment {
	appointment: Appointment;
	startMinutes: number;
	lane: number;
	laneCount: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

export const timeToMinutes = (time: string): number => {
	const match = /^(\d{1,2}):(\d{2})$/.exec(time?.trim() ?? "");
	if (!match) return NaN;
	return Number(match[1]) * 60 + Number(match[2]);
};

export const minutesToTime = (minutes: number): string => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Default range, widened (to whole hours) when an appointment falls outside so none is ever hidden. */
export const getVisibleRange = (
	appointments: Pick<Appointment, "time">[],
	startHour: number = AGENDA.START_HOUR,
	endHour: number = AGENDA.END_HOUR,
): AgendaRange => {
	let start = startHour * 60;
	let end = endHour * 60;

	for (const appointment of appointments) {
		const minutes = timeToMinutes(appointment.time);
		if (Number.isNaN(minutes)) continue;
		start = Math.min(start, Math.floor(minutes / 60) * 60);
		end = Math.max(end, Math.ceil((minutes + AGENDA.SLOT_MINUTES) / 60) * 60);
	}

	return { startMinutes: Math.max(0, start), endMinutes: Math.min(24 * 60, end) };
};

export const getSlotStarts = (range: AgendaRange): number[] => {
	const slots: number[] = [];
	for (let minutes = range.startMinutes; minutes < range.endMinutes; minutes += AGENDA.SLOT_MINUTES) {
		slots.push(minutes);
	}
	return slots;
};

export const minutesToOffset = (minutes: number, range: AgendaRange): number =>
	((minutes - range.startMinutes) / AGENDA.SLOT_MINUTES) * AGENDA.SLOT_HEIGHT_PX;

export const getGridHeight = (range: AgendaRange): number =>
	((range.endMinutes - range.startMinutes) / AGENDA.SLOT_MINUTES) * AGENDA.SLOT_HEIGHT_PX;

export const snapToSlot = (minutes: number): number =>
	Math.floor(minutes / AGENDA.SLOT_MINUTES) * AGENDA.SLOT_MINUTES;

export const formatHourLabel = (minutes: number): string => {
	const hour24 = Math.floor(minutes / 60) % 24;
	const suffix = hour24 < 12 ? "AM" : "PM";
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
	return `${hour12} ${suffix}`;
};

/**
 * Splits visually overlapping appointments into side-by-side lanes (e.g. 11:00 and 11:10).
 * A visual overlap is NOT a conflict: only the exact same date+time is, and the backend enforces it.
 */
export const layoutLanes = (appointments: Appointment[]): LaidOutAppointment[] => {
	const items = appointments
		.map((appointment) => ({ appointment, start: timeToMinutes(appointment.time) }))
		.filter((item) => !Number.isNaN(item.start))
		.sort((a, b) => a.start - b.start);

	const result: LaidOutAppointment[] = [];
	let cluster: { appointment: Appointment; start: number; lane: number }[] = [];
	let laneEnds: number[] = [];
	let clusterEnd = -Infinity;

	const flush = () => {
		const laneCount = Math.max(1, laneEnds.length);
		cluster.forEach((entry) =>
			result.push({ appointment: entry.appointment, startMinutes: entry.start, lane: entry.lane, laneCount }),
		);
		cluster = [];
		laneEnds = [];
	};

	for (const item of items) {
		if (cluster.length > 0 && item.start >= clusterEnd) flush();

		let lane = laneEnds.findIndex((end) => end <= item.start);
		if (lane === -1) {
			lane = laneEnds.length;
			laneEnds.push(0);
		}
		laneEnds[lane] = item.start + AGENDA.SLOT_MINUTES;
		cluster.push({ appointment: item.appointment, start: item.start, lane });
		clusterEnd = Math.max(clusterEnd, item.start + AGENDA.SLOT_MINUTES);
	}
	if (cluster.length > 0) flush();

	return result;
};

/** Only Scheduled/Confirmed appointments can be dragged (same rule as "Mover cita"). */
export const isAgendaMovable = (status: AppointmentStatus): boolean =>
	status === "scheduled" || status === "confirmed";

/**
 * Target start (minutes) after dragging a block `translationY` px. Returns null when the block stays
 * in the same slot or would leave the visible range.
 */
export const getDropMinutes = (
	startMinutes: number,
	translationY: number,
	range: AgendaRange,
): number | null => {
	const deltaSlots = Math.round(translationY / AGENDA.SLOT_HEIGHT_PX);
	if (deltaSlots === 0) return null;
	const target = snapToSlot(startMinutes + deltaSlots * AGENDA.SLOT_MINUTES);
	if (target < range.startMinutes || target >= range.endMinutes) return null;
	return target;
};
