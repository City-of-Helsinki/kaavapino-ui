import React from 'react';
//import VisTimeline from './VisTimeline';
import VisTimelineGroup from './VisTimelineGroup';
//import { Button } from 'hds-react'

const VisTimelinesContainer = ({deadlines}) => {
   // const [isTimeLineEditable, setIsTimeLineEditable] = useState(false);

/*     const toggleTimeLine = () => {
        setIsTimeLineEditable(!isTimeLineEditable);
    } */

/*     const saveTimeline = () => {
        alert("Tallennus toiminnallisuus ei ole vielä käytössä")
    } */

    return (
        <div>
            <VisTimelineGroup deadlines={deadlines}/>
{/*             {!isTimeLineEditable && <VisTimeline deadlines={deadlines}/>} */}
            <div className='edit-timeline-button-container'>
{/*                 <Button className='edit-timeline-button' size='small' variant='primary' onClick={() => saveTimeline()}>Tallenna</Button> */}
{/*                 <Button className='edit-timeline-button' size='small' variant='primary' onClick={() => toggleTimeLine()}>{isTimeLineEditable ? "Peruuta" : "Muokkaa aikajanaa"}</Button> */}
            </div>
        </div>
    );
};

export default VisTimelinesContainer;