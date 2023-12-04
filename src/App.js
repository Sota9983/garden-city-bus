import React, { useState, useEffect } from 'react';
import busTime from './busTime.json';
import { Typography, Button, Box } from '@mui/material';

const BusScheduleApp = () => {
  const [destination, setDestination] = useState(null);
  const [busData, setBusData] = useState(null);
  const [busTimeData, setBusTimeData] = useState(busTime);
  const [nextBus, setNextBus] = useState({
    "nextBusMinutes": undefined,
    "nextBusHour": undefined,
    "nextBusTime": undefined
  });
  const [nowTime, setNowTime] = useState(0);
  const [goto, setGoto] = useState("");
  const [morning, setMorning] = useState("");

  useEffect(() => {
    setBusTimeData(busTime);
  }, []);

  useEffect(() => {
    if (destination) {
      const data = busTimeData[destination];
      setBusData(data);
      updateGotoAndMorning(destination);
    }
  }, [busTimeData, destination]);

  const updateGotoAndMorning = (dest) => {
    const routes = {
      GTDtoGC: { goto: '五反田駅からガーデンシティへ行く', morning: '7:30-9時台は約4-6分間隔で運行' },
      GCtoGTD: { goto: 'ガーデンシティから五反田駅へ帰る', morning: '7:30-9:55は約4-6分間隔で運行' },
      SGWtoGC: { goto: '品川駅からガーデンシティへ行く', morning: '7:30-9時台は約6-7分間隔で運行' },
      GCtoSGW: { goto: 'ガーデンシティから品川駅へ帰る', morning: '7:30-9:55は約6-7分間隔で運行' },
    };

    const { goto, morning } = routes[dest] || {};
    setGoto(goto || '');
    setMorning(morning || '');
  };

  const handleButtonClick = (dest) => {
    setDestination(dest);
  };

  const renderButton = (label, dest, color) => (
    <Button variant="contained" color={color} onClick={() => handleButtonClick(dest)} sx={{ mt: 1 }}>
      {label}
    </Button>
  );

  useEffect(() => {
    const updateTime = () => {
      const currentTime = new Date();
      const hour = 9
      const minutes = 50
      const seconds = currentTime.getSeconds();
      const day = currentTime.getDay();
      const nowTimes = hour * 60 * 60 + minutes * 60 + seconds;

      const destinationData = busData && busData[hour];
      const destinationNextData = busData && busData[hour + 1];

      const nextBusMinutes = destinationData && destinationData.find(time => time - minutes > 0) ? destinationData.find(time => time - minutes > 0) : (destinationNextData ? destinationNextData[0] : undefined);
      const nextBusHour = destinationData && destinationData.find(time => time - minutes > 0) ? hour : (destinationNextData ? hour + 1 : undefined);
      const nextBusTime = nextBusHour * 60 * 60 + nextBusMinutes * 60;

      if (day === 0 || day === 6) {
        setNextBus({
          "nextBusMinutes": undefined,
          "nextBusHour": undefined,
          "nextBusTime": undefined
        })
      } else {
        setNextBus({
          "nextBusMinutes": ('00' + nextBusMinutes).slice(-2),
          "nextBusHour": nextBusHour,
          "nextBusTime": nextBusTime
        });
      }
      setNowTime(nowTimes);
    };

    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [busData]);

  const TimeView = () => (
    <React.Fragment>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Button onClick={() => handleButtonClick(null)}>←違う予定を確認する</Button>
        {nextBus.nextBusHour && nextBus.nextBusMinutes && goto && (
          <React.Fragment>
            <Typography variant="h6" sx={{ display: 'flex', justifyContent: 'center', border: 1, backgroundColor: 'aliceblue', width: window.innerWidth - 4 }}>
              {goto}
            </Typography>
            {nowTime / 60 >= 7 * 60 + 30 && nowTime / 60 <= 9 * 60 + 55 && morning &&
              <Typography>
                {morning}
              </Typography>
            }
            {(nowTime / 60) >= (9 * 60 + 55) && (
              <React.Fragment>
                <Typography>
                  次のバスは{nextBus.nextBusHour}:{nextBus.nextBusMinutes}です。
                </Typography>
                <Typography>
                  {Math.floor((nextBus.nextBusTime - nowTime) / 60)}分{(nextBus.nextBusTime - nowTime) % 60}秒後に発車します。
                </Typography>
              </React.Fragment>
            )}
          </React.Fragment>
        )}
        {(!nextBus.nextBusHour || !nextBus.nextBusMinutes) &&
          <Typography>
            本日のバスは終了しました。
          </Typography>
        }
        <Typography sx={{ p: 2 }}>
          バスの時刻表は<a href="https://multimedia.3m.com/mws/media/1749678O/shuttle-bus-time-202012-pdf.pdf">こちら</a>を参照しています。
        </Typography>
      </Box>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      {!destination && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ mt: 1 }}>ガーデンシティへ行く</Typography>
          {renderButton('五反田駅から', 'GTDtoGC')}
          {renderButton('品川駅から', 'SGWtoGC', 'success')}
          <Typography variant='h6' sx={{ mt: 2 }}>ガーデンシティから帰る</Typography>
          {renderButton('五反田駅へ', 'GCtoGTD')}
          {renderButton('品川駅へ', 'GCtoSGW', 'success')}
        </Box>
      )}
      {destination && <TimeView />}
    </React.Fragment>
  );
};

export default BusScheduleApp;
