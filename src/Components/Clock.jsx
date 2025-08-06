import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { createGlobalStyle } from "styled-components";

const CIRCLE_LENGTH = 408; // Circle circumference for radius=65 in SVG

// ----------- Styled Components ---------
const GlobalStyle = createGlobalStyle`
  body {
    background: ${({ dark }) => (dark ? "#201c2b" : "#fafcff")};
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    transition: background 0.25s;
  }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3vw 0 6vw 0;
  background: ${({ dark }) => (dark ? "#201c2b" : "#fafcff")};
  color: ${({ dark }) => (dark ? "#fbfaff" : "#25263a")};
  transition: background 0.25s, color 0.25s;
`;

const ControlsPanel = styled.div`
  display: flex;
  gap: 4vw;
  margin: 2em 0 1em 0;
  @media (max-width: 700px) {
    flex-direction: column;
    gap: 1.8em;
  }
`;
const ControlBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const CtrlLabel = styled.label`
  font-size: 1.13rem;
  letter-spacing: 0.02em;
  margin-bottom: 0.21em;
  font-weight: 500;
`;
const CtrlBtnGroup = styled.div`
  display: flex;
  gap: 0.75em;
`;
const SmallButton = styled.button`
  font-size: 1.6rem;
  font-weight: bold;
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: ${({ dark }) => (dark ? "#302d45" : "#fff")};
  color: #6753ff;
  border: 2px solid #6753ff;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  &:hover,
  &:focus {
    background: #eeddff;
    color: #271a46;
    outline: none;
  }
`;
const CtrlValue = styled.span`
  font-size: 1.14rem;
  font-weight: 500;
  width: 40px;
  text-align: center;
`;

const TimerCircleContainer = styled.div`
  position: relative;
  width: 335px;
  height: 335px;
  margin: 16px 0 18px 0;
  @media (max-width: 500px) {
    width: 215px;
    height: 215px;
  }
`;
const TimerSVG = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;
const TimerInner = styled.div`
  position: absolute;
  top: 54%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 86%;
  text-align: center;
  z-index: 10;
`;

const TimerLabel = styled.div`
  font-size: 1.12rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${({ phase }) =>
    phase === "Session"
      ? "#6753ff"
      : phase === "Break"
      ? "#2eb872"
      : "#ff9000"};
`;

const TimerDisplay = styled.div`
  font-size: 3.4rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  @media (max-width: 500px) {
    font-size: 2.2rem;
  }
`;

const CycleInfo = styled.div`
  font-size: 1.04rem;
  opacity: 0.69;
  margin: 4px 0 20px 0;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 24px;
  justify-content: center;
  margin: 14px 0 0 0;
  @media (max-width: 700px) {
    gap: 16vw;
    margin: 12px 0 0 0;
  }
`;

const ActionButton = styled.button`
  font-size: 1.13rem;
  font-weight: 700;
  padding: 0.93em 2em;
  border-radius: 17px;
  background: ${({ primary }) => (primary ? "#6753ff" : "transparent")};
  color: ${({ primary, dark }) =>
    primary ? "#fff" : dark ? "#fff" : "#6753ff"};
  border: 2px solid #6753ff;
  margin: 0;
  box-shadow: 0 1px 9px rgba(120, 80, 220, 0.09);
  cursor: pointer;
  transition: all 0.17s;
  opacity: ${({ disabled }) => (disabled ? 0.45 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? "none" : "auto")};
  &:hover,
  &:focus {
    background: ${({ primary }) => (primary ? "#38188a" : "#eeddff")};
    color: ${({ primary }) => (primary ? "#fff" : "#38188a")};
    outline: none;
  }
`;

const ThemeSwitch = styled.button`
  position: absolute;
  top: 2vw;
  right: 6vw;
  cursor: pointer;
  background: none;
  color: ${({ dark }) => (dark ? "#eeddff" : "#38188a")};
  border: none;
  font-size: 1.4rem;
  padding: 0.2em 0.6em;
  z-index: 90;
  &:hover,
  &:focus {
    color: #ff9000;
    outline: none;
  }
`;

// ----------- Main Functional Component ---------------
function Clock() {
  // Pomodoro logic state
  const [breakLength, setBreakLength] = useState(5);
  const [sessionLength, setSessionLength] = useState(25);
  const [timerLabel, setTimerLabel] = useState("Session");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);
  const [longBreakLength] = useState(15); // can make this user-editable if desired
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const local = localStorage.getItem("pomodoro-theme-dark");
    return local
      ? JSON.parse(local)
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Refs for interval logic
  const breakLengthRef = useRef(breakLength);
  const sessionLengthRef = useRef(sessionLength);
  const timerLabelRef = useRef(timerLabel);
  const cyclesCompletedRef = useRef(cyclesCompleted);
  const intervalRef = useRef(null);

  // Keep refs in sync
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
    cyclesCompletedRef.current = cyclesCompleted;
  }, [cyclesCompleted]);

  // Persist theme selection
  useEffect(() => {
    localStorage.setItem("pomodoro-theme-dark", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Reset timeLeft when phase/length changes and NOT running
  useEffect(() => {
    if (!isRunning) {
      if (timerLabel === "Session") setTimeLeft(sessionLength * 60);
      else if (timerLabel === "Break") setTimeLeft(breakLength * 60);
      else setTimeLeft(longBreakLength * 60);
    }
  }, [sessionLength, breakLength, longBreakLength, isRunning, timerLabel]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === 0) {
            let newLabel = timerLabelRef.current;
            let newTime = 0;
            let newCycles = cyclesCompletedRef.current;

            if (timerLabelRef.current === "Session") {
              newCycles += 1;
              setCyclesCompleted(newCycles);
              if (newCycles % sessionsBeforeLongBreak === 0) {
                newLabel = "Long Break";
                newTime = longBreakLength * 60;
              } else {
                newLabel = "Break";
                newTime = breakLengthRef.current * 60;
              }
            } else {
              newLabel = "Session";
              newTime = sessionLengthRef.current * 60;
            }
            setTimerLabel(newLabel);

            // Play beep
            const beep = document.getElementById("beep");
            if (beep) {
              beep.pause();
              beep.currentTime = 0;
              beep.play().catch(() => {});
            }

            // Desktop notification
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(`${newLabel} started!`);
            }
            return newTime;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [
    isRunning,
    breakLength,
    sessionLength,
    longBreakLength,
    sessionsBeforeLongBreak,
  ]);

  // Ask notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted")
      Notification.requestPermission();
  }, []);

  // Helper to format seconds as MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Compute progress circle
  const getDashOffset = () => {
    let total =
      timerLabel === "Session"
        ? sessionLength * 60
        : timerLabel === "Break"
        ? breakLength * 60
        : longBreakLength * 60;
    return CIRCLE_LENGTH * (1 - timeLeft / total);
  };

  // Handlers
  const handleReset = useCallback(() => {
    setIsRunning(false);
    setBreakLength(5);
    setSessionLength(25);
    setTimerLabel("Session");
    setTimeLeft(25 * 60);
    setCyclesCompleted(0);
    const beep = document.getElementById("beep");
    if (beep) {
      beep.pause();
      beep.currentTime = 0;
    }
  }, []);

  const handleStartStop = useCallback(() => setIsRunning((p) => !p), []);

  const adjustValue = (setter, current, delta, min, max) => {
    if (!isRunning) {
      const val = current + delta;
      if (val >= min && val <= max) setter(val);
    }
  };

  // Theme switch UI
  const switchTheme = () => setIsDarkMode((dark) => !dark);

  // Rendering
  return (
    <>
      <GlobalStyle dark={isDarkMode} />
      <Wrapper dark={isDarkMode}>
        <ThemeSwitch
          onClick={switchTheme}
          dark={isDarkMode}
          aria-label={
            isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {isDarkMode ? "🌙" : "☀️"}
        </ThemeSwitch>

        <ControlsPanel>
          <ControlBlock>
            <CtrlLabel htmlFor="break-length">Break</CtrlLabel>
            <CtrlBtnGroup>
              <SmallButton
                onClick={() =>
                  adjustValue(setBreakLength, breakLength, -1, 1, 60)
                }
                disabled={isRunning}
                dark={isDarkMode}
                aria-label="Decrease Break Length"
              >
                −
              </SmallButton>
              <CtrlValue id="break-length">{breakLength}</CtrlValue>
              <SmallButton
                onClick={() =>
                  adjustValue(setBreakLength, breakLength, 1, 1, 60)
                }
                disabled={isRunning}
                dark={isDarkMode}
                aria-label="Increase Break Length"
              >
                +
              </SmallButton>
            </CtrlBtnGroup>
          </ControlBlock>
          <ControlBlock>
            <CtrlLabel htmlFor="session-length">Session</CtrlLabel>
            <CtrlBtnGroup>
              <SmallButton
                onClick={() =>
                  adjustValue(setSessionLength, sessionLength, -1, 1, 60)
                }
                disabled={isRunning}
                dark={isDarkMode}
                aria-label="Decrease Session Length"
              >
                −
              </SmallButton>
              <CtrlValue id="session-length">{sessionLength}</CtrlValue>
              <SmallButton
                onClick={() =>
                  adjustValue(setSessionLength, sessionLength, 1, 1, 60)
                }
                disabled={isRunning}
                dark={isDarkMode}
                aria-label="Increase Session Length"
              >
                +
              </SmallButton>
            </CtrlBtnGroup>
          </ControlBlock>
        </ControlsPanel>

        <CycleInfo>
          Completed Pomodoros: {cyclesCompleted} / {sessionsBeforeLongBreak}
        </CycleInfo>

        <TimerCircleContainer aria-label="Pomodoro Timer">
          <TimerSVG viewBox="0 0 220 220">
            <circle
              stroke={isDarkMode ? "#423d5a" : "#ddd8f7"}
              fill="none"
              strokeWidth="22"
              r="65"
              cx="110"
              cy="110"
            />
            <circle
              stroke={
                timerLabel === "Session"
                  ? "#6753ff"
                  : timerLabel === "Break"
                  ? "#2eb872"
                  : "#ff9000"
              }
              fill="none"
              strokeWidth="22"
              strokeDasharray={CIRCLE_LENGTH}
              strokeDashoffset={getDashOffset()}
              strokeLinecap="round"
              r="65"
              cx="110"
              cy="110"
              style={{ transition: "stroke-dashoffset 1.05s linear" }}
            />
          </TimerSVG>
          <TimerInner>
            <TimerLabel phase={timerLabel} id="timer-label">
              {timerLabel}
            </TimerLabel>
            <TimerDisplay id="time-left">{formatTime(timeLeft)}</TimerDisplay>
          </TimerInner>
        </TimerCircleContainer>

        <ActionRow>
          <ActionButton
            primary
            onClick={handleStartStop}
            dark={isDarkMode}
            aria-pressed={isRunning}
            id="start_stop"
          >
            {isRunning ? "Pause" : "Start"}
          </ActionButton>
          <ActionButton onClick={handleReset} dark={isDarkMode} id="reset">
            Reset
          </ActionButton>
        </ActionRow>

        <audio
          id="beep"
          preload="auto"
          src="https://cdn.freecodecamp.org/testable-projects-fcc/audio/BeepSound.wav"
          aria-hidden="true"
        />
      </Wrapper>
    </>
  );
}

export default Clock;
