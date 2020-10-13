import log from 'loglevel'


export const levels = log.levels

export const getLogger = (name: string, level: 0 | 1 | 2 | 3 | 4 | 5 | null = null) => {
    const logger = log.getLogger(name)
    if (level !== null) logger.setLevel(level)
    return logger
}
