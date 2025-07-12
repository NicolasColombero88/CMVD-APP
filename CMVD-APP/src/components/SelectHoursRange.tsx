import React, { useState, useEffect } from "react";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";
import { Typography, Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function SelectHoursRange({
  set = () => null,
  value = "",
  disabled = false,
  labelText = "Hora",
}) {
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("");

  useEffect(() => {
    if (value && value !== timeRange) {
      let range = value.split(" - ");
      if (range.length === 2) {
        setStartTime(dayjs(range[0], "HH:mm"));
        setEndTime(dayjs(range[1], "HH:mm"));
      }
    }
  }, [value]);

  useEffect(() => {
  if (!startTime || !endTime) {
    setError("Debes seleccionar un horario válido de inicio y fin.");
  }
}, [startTime, endTime]);


  const isValidRange = (start, end) => {
    const diff = end.diff(start, "hour", true);
    return diff >= 2;
  };

const isWithinAllowedHours = (start, end) => {
  if (!start || !end) return false;

  const startH = start.hour(), startM = start.minute();
  const endH = end.hour(), endM = end.minute();
  const duration = end.diff(start, "hour", true);

  const isRetiro = labelText.toLowerCase().includes("etiro");
  const isEntrega = labelText.toLowerCase().includes("ntrega");

  if (duration < 2) {
    setError("Debe haber al menos 2 horas de diferencia.");
    return false;
  }

  if (isRetiro) {
    if (
      startH < 8 || startH > 14 ||
      endH < 10 || endH > 16 ||
      (endH === 16 && endM > 0)
    ) {
      setError("Para retiro:\nInicio entre 08:00 y 14:00\nFin entre 10:00 y 16:00\nMínimo 2h de diferencia.");
      return false;
    }
  }

  if (isEntrega) {
    if (
      startH < 9 || startH > 16 ||
      endH < 11 || endH > 18 ||
      (endH === 18 && endM > 0)
    ) {
      setError("Para entrega:\nInicio entre 09:00 y 16:00\nFin entre 11:00 y 18:00\nMínimo 2h de diferencia.");
      return false;
    }
  }

  setError("");
  return true;
};


  const handleStartChange = (newValue) => {
    setStartTime(newValue);
    if (!isWithinAllowedHours(newValue, endTime)) return;

    if (endTime && !isValidRange(newValue, endTime)) {
      setError("Debe haber al menos 2 horas de diferencia.");
    } else {
      setError("");
      updateTimeRange(newValue, endTime);
    }
  };

  const handleEndChange = (newValue) => {
    setEndTime(newValue);
    if (!isWithinAllowedHours(startTime, newValue)) return;

    if (startTime && !isValidRange(startTime, newValue)) {
      setError("Debe haber al menos 2 horas de diferencia.");
    } else {
      setError("");
      updateTimeRange(startTime, newValue);
    }
  };

  const updateTimeRange = (start, end) => {
    if (start && end) {
      const formattedStart = start.format("HH:mm");
      const formattedEnd = end.format("HH:mm");
      const range = `${formattedStart} - ${formattedEnd}`;
      set(range);
      setTimeRange(range);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <label
        htmlFor="recipient_neighborhood"
        className="block mb-2 text-sm font-medium text-gray-700"
      >
        {labelText}
      </label>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
         <MobileTimePicker
  label="Hora de inicio"
  disabled={disabled}
  value={startTime}
  onChange={handleStartChange}
  minutesStep={1}
  ampm={false}
  openTo="hours"
  minTime={labelText.toLowerCase().includes("etiro") ? dayjs().hour(8).minute(0) : dayjs().hour(9).minute(0)}
  maxTime={labelText.toLowerCase().includes("etiro") ? dayjs().hour(14).minute(0) : dayjs().hour(16).minute(0)}
  slotProps={{
    textField: {
      fullWidth: true,
      InputProps: {
        sx: {
          paddingTop: 0.35,
          paddingBottom: 0.35,
          borderRadius: 2,
          height: 37.6,
          fontSize: "14px",
        },
      },
      InputLabelProps: {
        sx: {
          fontSize: "12px",
        },
      },
    },
  }}
  sx={{ flex: "1 1 45%" }}
/>


          <MobileTimePicker
  label="Hora de fin"
  disabled={disabled}
  value={endTime}
  onChange={handleEndChange}
  minutesStep={1}
  ampm={false}
  openTo="hours"
  minTime={labelText.toLowerCase().includes("etiro") ? dayjs().hour(10).minute(0) : dayjs().hour(11).minute(0)}
  maxTime={labelText.toLowerCase().includes("etiro") ? dayjs().hour(16).minute(0) : dayjs().hour(18).minute(0)}
  slotProps={{
    textField: {
      fullWidth: true,
      InputProps: {
        sx: {
          paddingTop: 0.35,
          paddingBottom: 0.35,
          borderRadius: 2,
          height: 37.6,
          fontSize: "14px",
        },
      },
      InputLabelProps: {
        sx: {
          fontSize: "12px",
        },
      },
    },
  }}
  sx={{ flex: "1 1 45%" }}
/>
        </Box>

        {error && (
          <Typography variant="body2" color="error" mt={1}>
            {error}
          </Typography>
        )}
      </LocalizationProvider>
    </Box>
  );
}
