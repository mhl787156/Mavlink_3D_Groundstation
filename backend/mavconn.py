from pymavlink import mavutil

def get_ids(url):
    """
    Strip query string part off end of URL
    """
    sysid = 200
    compid = 158 # mavutil.mavlink.MAV_COMP_ID_PERIPHERAL
    if '?' in url:
        [url,params] = url.split('?')
        [sysid,compid] = params.split('=')[1].split(',')
        if url[-1] == '/':
            url = url[:-1]
    return url,int(sysid),int(compid)

def parse_host_port(hp_string,default_host=None,default_port=None):
    """
    Parse a host:port string, adding defaults if parts are missing
    """
    if hp_string == "":
        return f"{default_host}:{default_port}"
    match hp_string.split(':'):
        case ["",port]:
            return f"{default_host}:{port}"
        case [host,port]:
            return f"{host}:{port}"
        case [host]:
            return f"{host}:{default_port}"
        case _:
            raise Exception("Failed to parse host port")

def get_serial_connection(path,sysid,compid):
    device = None
    baudrate = None
    match path.split(":"):
        case [device,baudrate]:
            device = device
            baudrate = baudrate   
        case [device]:
            device = device

    return mavutil.mavserial(
        device,
        baud=baudrate,
        source_system=sysid,
        source_component=compid
    )

def get_mavlink_connection(url):
    """
    Parse a MAVROS style connection URL
    https://github.com/mavlink/mavros/blob/master/mavros/README.md#connection-url
    serial-hwfc and udp not yet supported
    Return a connection mavlink connection object
    """
    
    url,sysid,compid = get_ids(url)

    # Append the serial:// scheme if no scheme
    if '://' not in url:
        url = f"serial://{url}"

    [scheme,path] = url.split("://")
    match scheme:
        case "serial":
            return get_serial_connection(path,sysid,compid)
        case "serial-hwfc":
            raise Exception("Unsupported!")
        case "udp":
            raise Exception("Unsupported!")
            # [local,remote] = path.split('@')
            # local = parse_host_port(local,"0.0.0.0",14555)
            # remote = parse_host_port(remote,"0.0.0.0",14550)
            # return mavutil.mavudp()
        case "udp-b":
            raise Exception("Unsupported!")
        case "udp-pb":
            raise Exception("Unsupported!")
        case "tcp":
            return mavutil.mavtcp(
                f"{parse_host_port(path,'localhost',5760)}",
                source_system=sysid,
                source_component=compid
            )
        case "tcp-l":
            return mavutil.mavtcpin(
                f"{parse_host_port(path,'0.0.0.0',5760)}",
                source_system=sysid,
                source_component=compid
            )
        case _:
            raise Exception("Unknown scheme")
