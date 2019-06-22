class Library extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            busy: true,
            data: {},
        }
    }

    /**
     * Download list of library on mount
     */
    componentDidMount = () => {
        this.setState({ busy: true })
        fetch('/items')
            .then(response => response.json())
            .then(data => this.setState({ data }))
            .then(() => this.setState({ busy: false }))
    }

    /**
     * Convert timestamp to human readable format
     *
     * @param {string} timestamp
     * @return {string}
     */
    timeConverter = timestamp => {
        const addLeadZero = (item) => item < 9 ? `0${item}` : item

        const a = new Date(timestamp * 1000)
        const months = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec']
        const year = a.getFullYear()
        const month = addLeadZero(months[a.getMonth()])
        const date = addLeadZero(a.getDate())
        const hour = addLeadZero(a.getHours())
        const min = addLeadZero(a.getMinutes())
        const sec = addLeadZero(a.getSeconds())
        return date + '.' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec
    }

    /**
     * Render
     *
     * @return {*}
     */
    render() {
        const {
            busy,
            data,
        } = this.state

        if (busy) {
            return (
                <div className="spinner-border" role="status">
                    <span className="sr-only">Načítání...</span>
                </div>
            )
        }

        return (
            <div className="list-group">
                {Object.values(data).map(libItem => {
                    const imageIndex = libItem.findIndex(item => item.ending === 'jpg')
                    const fileIndex = libItem.findIndex(item => item.ending === 'mp3')

                    const image = libItem[imageIndex]
                    const sound = libItem[fileIndex]

                    return (
                        <a href={`downloads/${sound.file}`} className="list-group-item list-group-item-action d-flex" download>
                            <img
                                src={`downloads/${image.file}`}
                                className="mr-3"
                                alt={image.name}
                                style={{ maxHeight: '45px' }}
                            />
                            <div className="d-flex flex-column">
                                <h5 className="mt-0">{sound.name}</h5>
                                <small>{this.timeConverter(sound.time)}</small>
                                <small>{parseFloat(sound.size / 1000).toFixed(2)} kB</small>
                            </div>
                        </a>
                    )
                })}
            </div>

        )
    }
}

const e = React.createElement
const domContainer = document.getElementById('library')
ReactDOM.render(e(Library), domContainer)