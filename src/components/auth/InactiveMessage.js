import React, {useRef,useState,useEffect} from 'react'

function InactiveMessage(props) {
    const { idleModal } = props;
    const buttonStyle = {display : 'block', textDecoration:'underline'}
    const sessionExtend = () => {
        props.extendSession()
    }

     // We need ref in this, because we are dealing
    // with JS setInterval to keep track of it and
    // stop it when needed
    const Ref = useRef(null);
  
    // The state for our timer
    const [timer, setTimer] = useState('00:00:00');
  
    const getTimeRemaining = (e) => {
        const total = Date.parse(e) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor((total / 1000 / 60) % 60);
        //Hours not needed here but if needed somewhere else lets leave it
        //const hours = Math.floor((total / 1000 / 60 / 60) % 24);
        return {
            //hours
            total, minutes, seconds
        };
    }
  
    const startTimer = (e) => {
        //hours
        let { total, minutes, seconds } 
                    = getTimeRemaining(e);
        if (total >= 0) {
            // update the timer
            // check if less than 10 then we need to 
            // add '0' at the beginning of the variable
            setTimer(
               // (hours > 9 ? hours : '0' + hours) + ':' +
                (minutes > 9 ? minutes : '0' + minutes) + ':'
                + (seconds > 9 ? seconds : '0' + seconds)
            )
        }
    }
  
    const clearTimer = (e) => {
        // If you adjust it you should also need to
        // adjust the Endtime formula we are about
        // to code next    
        setTimer('00:10:00');
  
        // If you try to remove this line the 
        // updating of timer Variable will be
        // after 1000ms or 1sec
        if (Ref.current) clearInterval(Ref.current);
        const id = setInterval(() => {
            startTimer(e);
        }, 1000)
        Ref.current = id;
    }
  
    const getDeadTime = () => {
        let deadline = new Date();
        // This is where you need to adjust if 
        // you entend to add more time
        //600 === 10minutes
        deadline.setSeconds(deadline.getSeconds() + 600);
        return deadline;
    }
  
    // Start timer on componentDidMount
    useEffect(() => {
        clearTimer(getDeadTime());
        return () => {
        }
    }, []);
    //Show text and elements based on idleModal prop from IdleMonitor
    if (idleModal) {
        return (
        <div>
            Istuntosi vanhenee {timer} kuluttua.
            <a style={buttonStyle}  onClick={() => sessionExtend()} onKeyDown={() => sessionExtend()}> Jatka istuntoa</a>
        </div>
        )
    }
    else {
        return (
            <div>
                Istuntoa jatkettu
            </div>
        )
    }
}

export default InactiveMessage;