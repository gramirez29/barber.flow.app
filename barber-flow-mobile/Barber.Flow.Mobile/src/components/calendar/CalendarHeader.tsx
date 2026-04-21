import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, IconButton, ToggleButton } from "react-native-paper";
import { format } from "date-fns";
import { useTranslation } from "../../context/LanguageContext";

type ViewMode = "month" | "week" | "day";

interface Props {
    viewMode: ViewMode;
    currentDate: Date;
    onPrev: () => void;
    onNext: () => void;
    onChangeView: (mode: ViewMode) => void;
}

export const CalendarHeader: React.FC<Props> = ({
    viewMode,
    currentDate,
    onPrev,
    onNext,
    onChangeView,
}) => {
    const { translateText } = useTranslation();

    return (
        <View style={styles.header}>
        <IconButton icon="chevron-left" onPress={onPrev} />
        <Text style={styles.headerText}>
            {viewMode === "month" && format(currentDate, "MMMM yyyy")}
            {viewMode === "week" &&
            translateText("calendar.weekOf", {
                date: format(currentDate, "MMM d, yyyy"),
            })}
            {viewMode === "day" && format(currentDate, "MMM d, yyyy")}
        </Text>
        <IconButton icon="chevron-right" onPress={onNext} />
        <ToggleButton.Row
            onValueChange={(value) => onChangeView(value as ViewMode)}
            value={viewMode}
        >
            <ToggleButton icon="calendar-month" value="month" />
            <ToggleButton icon="calendar-week" value="week" />
            <ToggleButton icon="calendar-today" value="day" />
        </ToggleButton.Row>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        elevation: 2,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    headerText: {
        flex: 1,
        fontSize: 20,
        fontWeight: "bold",
        color: "#222",
    },
});
