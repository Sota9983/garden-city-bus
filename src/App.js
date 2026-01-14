import React, { useState, useEffect, useMemo } from 'react';
import busTime from './busTime.json';
import {
  Typography, Button, Box, AppBar, Toolbar, Icon, Table, TableBody,
  TableCell, TableHead, TableRow, Paper, Card, CardContent
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import { ArrowBack } from '@mui/icons-material';

const DAY_TYPES = {
  WEEKDAY: 'weekday',
  SATURDAY: 'saturday',
  SUNDAY: null
};

const getDayType = (dayOfWeek) => {
  if (dayOfWeek === 6) return DAY_TYPES.SATURDAY;
  if (dayOfWeek === 0) return DAY_TYPES.SUNDAY;
  return DAY_TYPES.WEEKDAY;
};

const getTimeRemaining = (busHour, busMinute) => {
  const now = new Date();
  const busTime = new Date(now);
  busTime.setHours(busHour, busMinute, 0, 0);

  const diff = busTime - now;
  if (diff < 0) return null;

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { minutes, seconds };
};

const formatTime = (hour, minute) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = dayNames[date.getDay()];

  return `${year}/${month}/${day} (${dayOfWeek})`;
};

const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return currentTime;
};

const useBusSchedule = (route, currentTime) => {
  const [nextBuses, setNextBuses] = useState([]);
  const [currentDescription, setCurrentDescription] = useState(null);

  useEffect(() => {
    if (!route) return;

    const now = currentTime;
    const dayType = getDayType(now.getDay());

    if (!dayType) {
      setCurrentDescription(null);
      setNextBuses([]);
      return;
    }

    const schedule = route.schedule[dayType];
    const hour = now.getHours();
    const minute = now.getMinutes();

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
  }, [route, currentTime]);

  return { nextBuses, currentDescription };
};

const TimeTableRow = ({ hour, weekdayData, saturdayData }) => {
  const formatCellText = (data) => {
    if (!data) return '';
    return `${data.times.join(' / ')} ${data.description ?? ''}`.trim();
  };

  return (
    <TableRow>
      <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>{hour}</TableCell>
      <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}>
        {formatCellText(weekdayData)}
      </TableCell>
      <TableCell>{formatCellText(saturdayData)}</TableCell>
    </TableRow>
  );
};

const TimeTable = ({ route }) => {
  const allHours = useMemo(() => {
    const weekday = route.schedule.weekday;
    const saturday = route.schedule.saturday;
    return Array.from(
      new Set([...Object.keys(weekday), ...Object.keys(saturday)])
    ).sort((a, b) => Number(a) - Number(b));
  }, [route]);

  return (
    <Paper sx={{ marginTop: 3, width: '99%', overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}><b>時</b></TableCell>
            <TableCell sx={{ borderRight: '1px solid #e0e0e0' }}><b>平日</b></TableCell>
            <TableCell sx={{ minWidth: 44 }}><b>土曜日</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allHours.map(h => (
            <TimeTableRow
              key={h}
              hour={h}
              weekdayData={route.schedule.weekday[h]}
              saturdayData={route.schedule.saturday[h]}
            />
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

const BusInfoCard = ({ bus, index }) => {
  const remaining = getTimeRemaining(bus.h, bus.m);
  const isNext = index === 0;

  return (
    <Card sx={{ background: '#e3f2fd' }}>
      <CardContent sx={{ py: '8px !important' }}>
        <Typography variant="subtitle2">
          {isNext ? '次: ' : 'その次: '}
          {formatTime(bus.h, bus.m)}
        </Typography>
        {remaining && isNext && (
          <Typography variant="body1" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
            あと {remaining.minutes}分{String(remaining.seconds).padStart(2, '0')}秒
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

const RouteInfo = ({ route, nextBuses, currentDescription, onBack, currentTime }) => (
  <Box sx={{ p: 2 }}>
    <Button onClick={onBack} sx={{ pl: 0, display: 'inline-flex', justifyContent: 'flex-start', gap: 0.5 }}>
      <ArrowBack sx={{ fontSize: 'medium' }} />
      <Typography variant="body2">{"戻る"}</Typography>
    </Button>
    <Typography variant="body2" color="text.secondary">{formatDateTime(currentTime)}</Typography>
    <Typography variant="h6" sx={{ mb: 1 }}>{route.title}</Typography>

    {currentDescription && (
      <Card sx={{ background: '#ffe6e6', mb: 2 }}>
        <CardContent sx={{ py: '8px !important' }}>
          <Typography variant="h6" sx={{ color: '#d32f2f' }}>
            {currentDescription}
          </Typography>
        </CardContent>
      </Card>
    )}

    {!currentDescription && nextBuses.length > 0 && (
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {nextBuses.map((bus, i) => (
          <BusInfoCard key={i} bus={bus} index={i} />
        ))}
      </Box>
    )}

    {!currentDescription && nextBuses.length === 0 && (
      <Card sx={{ background: '#f5f5f5', mb: 2 }}>
        <CardContent sx={{ py: '8px !important' }}>
          <Typography variant="h6">本日のバスは終了しました。</Typography>
        </CardContent>
      </Card>
    )}

    <TimeTable route={route} />
  </Box>
);

const RouteGroup = ({ routes, title, onSelectRoute }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
      {title}
    </Typography>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {routes.map(route => (
        <Button
          key={route.id}
          variant="contained"
          sx={{ height: 32 }}
          onClick={() => onSelectRoute(route.id)}
          color={route.color}
        >
          {route.buttonName}
        </Button>
      ))}
    </Box>
  </Box>
);

const BusScheduleApp = () => {
  const [destination, setDestination] = useState(null);
  const currentTime = useCurrentTime();

  const route = useMemo(
    () => busTime.routes.find(r => r.id === destination),
    [destination]
  );

  const { nextBuses, currentDescription } = useBusSchedule(route, currentTime);

  const groupedRoutes = useMemo(() => ({
    station: busTime.routes.filter(r => r.from === 'station'),
    garden: busTime.routes.filter(r => r.from === 'garden')
  }), []);

  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ display: 'flex', justifyContent: 'center' }}>
          <Icon sx={{ mr: 2 }}><DirectionsBusIcon /></Icon>
          <Typography variant="h6">GG品川御殿山シャトルバス</Typography>
        </Toolbar>
      </AppBar>

      {!destination ? (
        <Box sx={{ p: 2 }}>
          <RouteGroup
            routes={groupedRoutes.station}
            title="ガーデングレイスへ行く"
            onSelectRoute={setDestination}
          />
          <RouteGroup
            routes={groupedRoutes.garden}
            title="ガーデングレイスから帰る"
            onSelectRoute={setDestination}
          />
        </Box>
      ) : (
        <RouteInfo
          route={route}
          nextBuses={nextBuses}
          currentDescription={currentDescription}
          onBack={() => setDestination(null)}
          currentTime={currentTime}
        />
      )}
    </>
  );
};

export default BusScheduleApp;