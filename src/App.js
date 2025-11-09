import React, { useState, useEffect } from 'react';
import busTime from './busTime.json';
import {
  Typography, Button, Box, AppBar, Toolbar, Icon, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, Card, CardContent
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const BusScheduleApp = () => {
  const [destination, setDestination] = useState(null);
  const [nextBuses, setNextBuses] = useState([]);
  const [currentDescription, setCurrentDescription] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const route = busTime.routes.find(r => r.id === destination);

  const getJapanTime = () => {
    const now = new Date();
    return new Date(now.getTime() + 9 * 60 * 60 * 1000);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeRemaining = (busHour, busMinute) => {
    const now = getJapanTime();
    const busTime = new Date(now);
    busTime.setUTCHours(busHour, busMinute, 0, 0);
    
    const diff = busTime - now;
    if (diff < 0) return null;
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { minutes, seconds };
  }

  useEffect(() => {
    if (!route) return;

    const now = getJapanTime();
    const dayOfWeek = now.getDay();

    const dayType = dayOfWeek === 6 ? "saturday" : (dayOfWeek === 0 ? null : "weekday");

    if (!dayType) {
      setCurrentDescription(null);
      setNextBuses([]);
      return;
    }

    const schedule = route.schedule[dayType];

    const hour = now.getUTCHours();
    const minute = now.getUTCMinutes();

    let descriptionToShow = null;
    const upcomingBuses = [];

    Object.entries(schedule).forEach(([h, v]) => {
      const hNum = Number(h);

      if ((hNum === hour || (hour >= 0 && hour < 7)) && v.description) {
        descriptionToShow = v.description;
      }

      v.times.forEach(m => {
        const mNum = Number(m);
        if (hNum > hour || (hNum === hour && mNum > minute)) {
          upcomingBuses.push({ h: hNum, m: mNum });
        }
      });
    });

    setCurrentDescription(descriptionToShow);
    setNextBuses(upcomingBuses.slice(0, 2));

  }, [destination, route, currentTime]);

  const timeTable = () => {
    if (!route) return null;
    const weekday = route.schedule.weekday;
    const saturday = route.schedule.saturday;
    const allHours = Array.from(
      new Set([...Object.keys(weekday), ...Object.keys(saturday)])
    ).sort((a, b) => Number(a) - Number(b));

    return (
      <Paper sx={{ marginTop: 3, width: "99%", overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}><b>時</b></TableCell>
              <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}><b>平日</b></TableCell>
              <TableCell><b>土曜日</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allHours.map(h => {
              const w = weekday[h];
              const s = saturday[h];
              const weekdayText = w
                ? `${w.times.join(" / ")} ${w.description ?? ""}`.trim()
                : "";
              const saturdayText = s
                ? `${s.times.join(" / ")} ${s.description ?? ""}`.trim()
                : "";

              return (
                <TableRow key={h}>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{h}</TableCell>
                  <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{weekdayText}</TableCell>
                  <TableCell>{saturdayText}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  const groupedRoutes = {
    station: busTime.routes.filter(r => r.from === "station"),
    garden: busTime.routes.filter(r => r.from === "garden")
  };

  const renderGroup = (routes, title) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 ,display: 'flex',justifyContent: 'center' }}>{title}</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {routes.map(r => (
          <Button
            key={r.id}
            variant="contained"
            sx={{ height: 30 }}
            onClick={() => setDestination(r.id)}
            color={r.color}
          >
            {r.buttonName}
          </Button>
        ))}
      </Box>
    </Box>
  );

  const renderSelectedRouteInfo = () => {
    if (!route) return null;

    return (
      <Box sx={{ p: 2 }}>
        <Button onClick={() => setDestination(null)}>← 戻る</Button>
        <Typography variant="h6" sx={{ mb: 1 }}>{route.title}</Typography>

        {currentDescription && (
          <Card sx={{ background: "#ffe6e6", mb: 2 }}>
            <CardContent sx={{ py:"8px !important"}}>
              <Typography variant="h6" sx={{ color: "#d32f2f" }}>
                {currentDescription}
              </Typography>
            </CardContent>
          </Card>
        )}

        {!currentDescription && nextBuses.length > 0 && (
          <Box sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
            {nextBuses.map((b, i) => {
              const remaining = getTimeRemaining(b.h, b.m);
              return (
              <Card key={i} sx={{ background: "#e3f2fd"}}>
                <CardContent sx={{ py:"8px !important"}}>
                  <Typography variant="subtitle2">
                    {i === 0 ? "次: " : "その次: "}
                    {String(b.h).padStart(2, "0")}:{String(b.m).padStart(2, "0")}
                  </Typography>
                  {remaining && i === 0 && (
                      <Typography variant="body1" sx={{ color: "#1976d2", fontWeight: "bold", mt: 1 }}>
                        あと {remaining.minutes}分{String(remaining.seconds).padStart(2, "0")}秒
                      </Typography>
                    )}
                </CardContent>
              </Card>
            )})}
          </Box>
        )}

        {!currentDescription && nextBuses.length === 0 && (
          <Card sx={{ background: "#f5f5f5", mb: 2 }}>
            <CardContent>
              <Typography variant="h6">本日のバスは終了しました。</Typography>
            </CardContent>
          </Card>
        )}

        {timeTable()}
      </Box>
    );
  };

  return (
    <>
      <AppBar position='static'>
        <Toolbar sx={{ display: "flex", justifyContent: 'center' }}>
          <Icon sx={{ mr: 2 }}><DirectionsBusIcon /></Icon>
          <Typography variant="h6">GG品川御殿山シャトルバス</Typography>
        </Toolbar>
      </AppBar>

      {!destination && (
        <Box sx={{ p: 2 }}>
          {renderGroup(groupedRoutes.station, "ガーデングレイスへ行く")}
          {renderGroup(groupedRoutes.garden, "ガーデングレイスから帰る")}
        </Box>
      )}

      {destination && renderSelectedRouteInfo()}
    </>
  );
};

export default BusScheduleApp;