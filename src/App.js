import React, { useState, useEffect } from 'react';
import busTime from './busTime.json'
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
  // const [next, setNext] = useState(null);
  const [nowTime, setNowTime] = useState(0);

  useEffect(() => {
    // busTime.json読み込み用のuseEffect
    // このuseEffectは初回のみ実行される
    // busTime.jsonが変更されない限り再実行されない
    // 一度読み込んだデータはstateに保存され、それを使って処理を行う
    setBusTimeData(busTime);
  }, []);

  useEffect(() => {
    // destinationが変更されたら適切なデータを取得するロジックをここに追加
    if (destination) {
      const data = busTimeData[destination];
      setBusData(data);
    }
  }, [busTimeData,destination]);

  const handleButtonClick = (dest) => {
    // setDestinationを呼ぶときにアロー関数を使用
    setDestination(dest);
  };
  const renderButton = (label, dest, color) => (
    <Button variant='contained' color={color} onClick={() => handleButtonClick(dest)} sx={{ mt: 1 }}>
      {label}
    </Button>
  );



  useEffect(() => {
    const updateTime = () => {
      const currentTime = new Date();
      const hour = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const seconds = currentTime.getSeconds();
      const nowTimes = hour * 60 * 60 + minutes * 60 + seconds;
  
      const destinationData = busData && busData[hour];//現在時刻の出発分を取得
      const destinationNextData = busData && busData[hour + 1];
  
      const nextBusMinutes = destinationData && destinationData.find(time => time - minutes > 0) ? destinationData.find(time => time - minutes > 0) : (destinationNextData ? destinationNextData[0] : undefined);
      const nextBusHour = destinationData && destinationData.find(time => time - minutes > 0) ? hour : (destinationNextData ? hour + 1 : undefined);
      const nextBusTime = nextBusHour * 60 * 60 + nextBusMinutes * 60;
      setNextBus({
        "nextBusMinutes": nextBusMinutes,
        "nextBusHour": nextBusHour,
        "nextBusTime": nextBusTime
      });
      setNowTime(nowTimes);
    };
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, [busData]);

  const TimeView = () => {
    return (
      <React.Fragment>
        <Button onClick={() => handleButtonClick(null)}>←違う予定を確認する</Button>
        {nextBus.nextBusHour && nextBus.nextBusMinutes &&
          <Typography>
            次のバスは{nextBus.nextBusHour}:{nextBus.nextBusMinutes}です。
            {Math.floor((nextBus.nextBusTime - nowTime) / 60)}分{(nextBus.nextBusTime - nowTime) % 60}秒後に発車します。
          </Typography>
        }
        {(!nextBus.nextBusHour || !nextBus.nextBusMinutes) &&
          <Typography>
            本日のバスは終了しました。
          </Typography>
        }
        <Typography>
          バスの時刻表は<a href="https://multimedia.3m.com/mws/media/1749678O/shuttle-bus-time-202012-pdf.pdf">こちら</a>を参照しています。
        </Typography>
      </React.Fragment>
    );
  };

  return (
    <React.Fragment>
      {!destination &&
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography variant='h6' sx={{ mt: 1 }}>ガーデンシティへ行く</Typography>
          {renderButton('五反田駅から', 'GTDtoGC')}
          {renderButton('品川駅から', 'SGWtoGC', 'success')}
          <Typography variant='h6' sx={{ mt: 2 }}>ガーデンシティから帰る</Typography>
          {renderButton('五反田駅へ', 'GCtoGTD')}
          {renderButton('品川駅へ', 'GCtoSGW', 'success')}
        </Box>
      }
      {
        destination && TimeView()
      }
    </React.Fragment>
  );
};

export default BusScheduleApp;
