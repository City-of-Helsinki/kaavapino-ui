import { useCallback, useEffect, useState } from 'react'

export const useIsTabActive = () => {
    const [isTabVisible, setIsTabVisible] = useState(true)

    const handleFocus = useCallback(() => {
        setIsTabVisible(true)
    }, [])

    const handeBlur = useCallback(() => {
        setIsTabVisible(false)
    }, [])

    useEffect(() => {
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handeBlur)
    return () => {
        window.removeEventListener('focus', handleFocus)
        window.removeEventListener('blur', handeBlur)
    };
    }, [])

    return isTabVisible
}