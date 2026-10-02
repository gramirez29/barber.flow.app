import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import type { Appointment } from "../../features/appointments/appointments.types";
import { AppTheme } from "../../theme/themes";
import { useAppTheme } from "../../theme/ThemeContext";
import {
	AGENDA,
	formatHourLabel,
	getDropMinutes,
	getGridHeight,
	getSlotStarts,
	getVisibleRange,
	isAgendaMovable,
	layoutLanes,
	minutesToOffset,
	minutesToTime,
	timeToMinutes,
	type AgendaRange,
} from "../../utils/agendaLayout";

interface AgendaDayViewProps {
	/** yyyy-MM-dd, used to show the "now" line when it is today. */
	date: string;
	appointments: Appointment[];
	onAddAt: (time: string) => void;
	onOpen: (appointment: Appointment) => void;
	/** Moves the appointment to `newTime` on the same day. Reject/throw to roll the block back. */
	onMove: (appointment: Appointment, newTime: string) => Promise<void>;
	/** Lets the parent lock its own scroll while a block is being dragged. */
	onDragActiveChange?: (active: boolean) => void;
}

const statusColors = (theme: AppTheme): Record<Appointment["status"], string> => ({
	completed: "#10B981",
	confirmed: theme.colors.accent,
	scheduled: "#3B82F6",
	cancelled: theme.colors.error,
});

interface BlockProps {
	appointment: Appointment;
	top: number;
	lane: number;
	laneCount: number;
	range: AgendaRange;
	color: string;
	pending: boolean;
	onOpen: (appointment: Appointment) => void;
	onDrop: (appointment: Appointment, newMinutes: number) => void;
	onDragActiveChange?: (active: boolean) => void;
}

const AgendaBlock: React.FC<BlockProps> = ({
	appointment,
	top,
	lane,
	laneCount,
	range,
	color,
	pending,
	onOpen,
	onDrop,
	onDragActiveChange,
}) => {
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const translateY = useSharedValue(0);
	const dragging = useSharedValue(false);
	const movable = isAgendaMovable(appointment.status) && !pending;
	const startMinutes = timeToMinutes(appointment.time);

	const handleOpen = useCallback(() => onOpen(appointment), [appointment, onOpen]);
	const handleDrop = useCallback(
		(translationY: number) => {
			const target = getDropMinutes(startMinutes, translationY, range);
			if (target !== null) onDrop(appointment, target);
		},
		[appointment, onDrop, range, startMinutes],
	);
	const notifyDrag = useCallback((active: boolean) => onDragActiveChange?.(active), [onDragActiveChange]);

	// Long press (250ms) before dragging so a normal swipe still scrolls the page.
	const pan = Gesture.Pan()
		.enabled(movable)
		.activateAfterLongPress(250)
		.onStart(() => {
			dragging.value = true;
			runOnJS(notifyDrag)(true);
		})
		.onUpdate((event) => {
			translateY.value = event.translationY;
		})
		.onEnd((event) => {
			runOnJS(handleDrop)(event.translationY);
		})
		.onFinalize(() => {
			dragging.value = false;
			translateY.value = 0;
			runOnJS(notifyDrag)(false);
		});

	const tap = Gesture.Tap().onEnd((_event, success) => {
		if (success) runOnJS(handleOpen)();
	});

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }, { scale: dragging.value ? 1.03 : 1 }],
		zIndex: dragging.value ? 20 : 1,
		opacity: dragging.value ? 0.9 : 1,
	}));

	return (
		<GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
			<Animated.View
				style={[
					styles.block,
					{
						top,
						left: `${(lane / laneCount) * 100}%`,
						width: `${100 / laneCount}%`,
						height: AGENDA.SLOT_HEIGHT_PX - 4,
						borderLeftColor: color,
						backgroundColor: `${color}26`,
					},
					pending && styles.blockPending,
					animatedStyle,
				]}
			>
				<Text style={styles.blockName} numberOfLines={1}>
					{appointment.clientName}
				</Text>
				<Text style={styles.blockMeta} numberOfLines={1}>
					{[appointment.time, appointment.serviceName].filter(Boolean).join(" · ")}
				</Text>
			</Animated.View>
		</GestureDetector>
	);
};

export const AgendaDayView: React.FC<AgendaDayViewProps> = ({
	date,
	appointments,
	onAddAt,
	onOpen,
	onMove,
	onDragActiveChange,
}) => {
	const { theme } = useAppTheme();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const colors = useMemo(() => statusColors(theme), [theme]);
	// Optimistic times while the PATCH runs; cleared on success or failure (a rejection snaps back).
	const [pendingTimes, setPendingTimes] = useState<Record<string, string>>({});

	const displayed = useMemo(
		() =>
			appointments.map((appointment) =>
				pendingTimes[appointment.id] ? { ...appointment, time: pendingTimes[appointment.id] } : appointment,
			),
		[appointments, pendingTimes],
	);

	const range = useMemo(() => getVisibleRange(displayed), [displayed]);
	const slots = useMemo(() => getSlotStarts(range), [range]);
	const laidOut = useMemo(() => layoutLanes(displayed), [displayed]);
	const gridHeight = getGridHeight(range);

	const now = new Date();
	const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	const showNow = date === todayKey && nowMinutes >= range.startMinutes && nowMinutes < range.endMinutes;

	const handleDrop = useCallback(
		(appointment: Appointment, newMinutes: number) => {
			const newTime = minutesToTime(newMinutes);
			setPendingTimes((current) => ({ ...current, [appointment.id]: newTime }));
			void onMove(appointment, newTime)
				.catch(() => undefined)
				.finally(() =>
					setPendingTimes((current) => {
						const next = { ...current };
						delete next[appointment.id];
						return next;
					}),
				);
		},
		[onMove],
	);

	return (
		<View style={[styles.container, { height: gridHeight }]}>
			{slots.map((slot) => {
				const isHour = slot % 60 === 0;
				const top = minutesToOffset(slot, range);
				return (
					<React.Fragment key={slot}>
						{isHour ? <Text style={[styles.hourLabel, { top: top - 7 }]}>{formatHourLabel(slot)}</Text> : null}
						<View style={[styles.line, { top }, isHour ? styles.lineHour : styles.lineHalf]} />
						<Pressable
							style={[styles.spot, { top, height: AGENDA.SLOT_HEIGHT_PX }]}
							onPress={() => onAddAt(minutesToTime(slot))}
						/>
					</React.Fragment>
				);
			})}

			<View style={styles.blocksArea} pointerEvents="box-none">
				{laidOut.map(({ appointment, startMinutes, lane, laneCount }) => (
					<AgendaBlock
						key={appointment.id}
						appointment={appointment}
						top={minutesToOffset(startMinutes, range) + 2}
						lane={lane}
						laneCount={laneCount}
						range={range}
						color={colors[appointment.status] ?? theme.colors.textSecondary}
						pending={Boolean(pendingTimes[appointment.id])}
						onOpen={onOpen}
						onDrop={handleDrop}
						onDragActiveChange={onDragActiveChange}
					/>
				))}
			</View>

			{showNow ? (
				<View style={[styles.nowLine, { top: minutesToOffset(nowMinutes, range) }]} pointerEvents="none">
					<View style={styles.nowDot} />
				</View>
			) : null}
		</View>
	);
};

const createStyles = (theme: AppTheme) =>
	StyleSheet.create({
		container: {
			position: "relative",
			marginTop: 8,
		},
		hourLabel: {
			position: "absolute",
			left: 0,
			width: AGENDA.GUTTER_PX - 8,
			fontSize: 11,
			fontWeight: "600",
			color: theme.colors.textSecondary,
		},
		line: {
			position: "absolute",
			left: AGENDA.GUTTER_PX,
			right: 0,
			borderTopWidth: 1,
		},
		lineHour: {
			borderTopColor: theme.colors.border,
		},
		lineHalf: {
			borderTopColor: `${theme.colors.border}66`,
		},
		spot: {
			position: "absolute",
			left: AGENDA.GUTTER_PX,
			right: 0,
		},
		blocksArea: {
			position: "absolute",
			top: 0,
			bottom: 0,
			left: AGENDA.GUTTER_PX + 4,
			right: 0,
		},
		block: {
			position: "absolute",
			borderRadius: 10,
			borderLeftWidth: 4,
			paddingHorizontal: 8,
			paddingVertical: 4,
			justifyContent: "center",
			overflow: "hidden",
		},
		blockPending: {
			opacity: 0.6,
		},
		blockName: {
			fontSize: 13,
			fontWeight: "700",
			color: theme.colors.textPrimary,
		},
		blockMeta: {
			fontSize: 11,
			color: theme.colors.textSecondary,
		},
		nowLine: {
			position: "absolute",
			left: AGENDA.GUTTER_PX,
			right: 0,
			height: 2,
			backgroundColor: theme.colors.error,
		},
		nowDot: {
			position: "absolute",
			left: -4,
			top: -3,
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: theme.colors.error,
		},
	});
