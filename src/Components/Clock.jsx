import { useState, useEffect, useRef } from 'react';

function Clock() {
  const [breakLength, setBreakLength] = useState(5);
  const [sessionLength, setSessionLength] = useState(25);
  const [timerLabel, setTimerLabel] = useState('Session');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  const breakLengthRef = useRef(breakLength);
  const sessionLengthRef = useRef(sessionLength);
  const timerLabelRef = useRef(timerLabel);
  const intervalRef = useRef(null);

  useEffect(() => {
    breakLengthRef.current = breakLength;
  }, [breakLength]);

  useEffect(() => {
    sessionLengthRef.current = sessionLength;
  }, [sessionLength]);

  useEffect(() => {
    timerLabelRef.current = timerLabel;
  }, [timerLabel]);

  useEffect(() => {
    if (!isRunning) {
      if (timerLabel === 'Session') {
        setTimeLeft(sessionLength * 60);
      } else {
        setTimeLeft(breakLength * 60);
      }
    }
  }, [sessionLength, breakLength, isRunning, timerLabel]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime < 0) {
            const newLabel = timerLabelRef.current === 'Session' ? 'Break' : 'Session';
            const newTimeLeft = newLabel === 'Break' ? breakLengthRef.current * 60 : sessionLengthRef.current * 60;
            setTimerLabel(newLabel);
            const beep = document.getElementById('beep');
            if (beep) {
              beep.play().catch(error => console.log('Play error:', error));
            }
            return newTimeLeft;
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const handleBreakDecrement = () => {
    if (breakLength > 1) {
      setBreakLength(prev => prev - 1);
    }
  };

  const handleBreakIncrement = () => {
    if (breakLength < 60) {
      setBreakLength(prev => prev + 1);
    }
  };

  const handleSessionDecrement = () => {
    if (sessionLength > 1) {
      setSessionLength(prev => prev - 1);
    }
  };

  const handleSessionIncrement = () => {
    if (sessionLength < 60) {
      setSessionLength(prev => prev + 1);
    }
  };

  const handleStartStop = () => {
    setIsRunning(prev => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setBreakLength(5);
    setSessionLength(25);
    setTimerLabel('Session');
    setTimeLeft(25 * 60);
    const beep = document.getElementById('beep');
    if (beep) {
      beep.pause();
      beep.currentTime = 0;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      <div className="controls">
        <div id="break-control">
          <div id="break-label">Break Length</div>
          <button id="break-decrement" onClick={handleBreakDecrement}>-</button>
          <div id="break-length">{breakLength}</div>
          <button id="break-increment" onClick={handleBreakIncrement}>+</button>
        </div>
        <div id="session-control">
          <div id="session-label">Session Length</div>
          <button id="session-decrement" onClick={handleSessionDecrement}>-</button>
          <div id="session-length">{sessionLength}</div>
          <button id="session-increment" onClick={handleSessionIncrement}>+</button>
        </div>
      </div>
      <div className="timer">
        <div id="timer-label">{timerLabel}</div>
        <div id="time-left">{formatTime(timeLeft)}</div>
        <button id="start_stop" onClick={handleStartStop}>
          {isRunning ? 'Stop' : 'Start'}
        </button>
        <button id="reset" onClick={handleReset}>Reset</button>
      </div>
      <audio id="beep" preload="auto" src="https://cdn.freecodecamp.org/testable-projects-fcc/audio/BeepSound.wav" />
    </div>
  );
}

export default Clock;