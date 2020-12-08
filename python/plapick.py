import requests
import pymysql
import sys
import os


def get_mysql_info():
    ret = {
        'MYSQL_USER': '',
        'MYSQL_PASSWD': '',
        'MYSQL_DATABASE': '',
        'MYSQL_HOST': '',
        'MYSQL_PORT': ''
    }
    with open(os.path.expanduser('~/plapick/.env'), 'r') as f:
        lines = f.readlines()
        for line in lines:
            if 'MYSQL_USER' in line: ret['MYSQL_USER'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_PASSWD' in line: ret['MYSQL_PASSWD'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_DATABASE' in line: ret['MYSQL_DATABASE'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_HOST' in line: ret['MYSQL_HOST'] = line.split('=')[1].replace('\n', '')
            elif 'MYSQL_PORT' in line: ret['MYSQL_PORT'] = line.split('=')[1].replace('\n', '')
    return ret


def init(argv):
    try:
        mysql_info = get_mysql_info()

        conn = pymysql.connect(
            host=mysql_info['MYSQL_HOST'],
            user=mysql_info['MYSQL_USER'],
            passwd=mysql_info['MYSQL_PASSWD'],
            db=mysql_info['MYSQL_DATABASE'],
            port=int(mysql_info['MYSQL_PORT']),
            charset='utf8'
        )
        cursor = conn.cursor(pymysql.cursors.DictCursor)

        p_n_id = argv[1]

        query = "SELECT * FROM t_places WHERE p_n_id = %s"
        cursor.execute(query, (p_n_id))
        results = cursor.fetchall()
        if len(results) > 0:
            print('EXISTS')
            return

        url = 'https://map.naver.com/v5/api/sites/summary/' + p_n_id
        params = { 'lang': 'ko' }
        headers = {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
            'referer': 'https://map.naver.com/',
            'expires': 'Sat, 01 Jan 2000 00:00:00 GMT',
            'pragma': 'no-cache',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        }
        response = requests.get(url, params=params, headers=headers)
        n_place = response.json()

        try:
            p_n_id = n_place['id']
        except:
            print('NO_PLACE')
            return

        p_name = n_place['name']
        p_latitude = n_place['y']
        p_longitude = n_place['x']
        p_address = n_place['fullAddress']
        try: p_road_address = n_place['fullRoadAddress']
        except: p_road_address = ''
        try: p_phone = n_place['phone']
        except: p_phone = ''
        p_category = n_place['category']
        try: p_biz = n_place['bizhourInfo']
        except: p_biz = ''
        p_data = str(n_place)

        query = """
            INSERT INTO t_places
                (p_n_id, p_name, p_latitude, p_longitude, p_geometry, p_address,
                p_road_address, p_phone, p_category, p_biz, p_data)
            VALUES
                (%s, %s, %s, %s, POINT(%s, %s), %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (p_n_id, p_name, p_latitude, p_longitude, p_longitude, p_latitude,
            p_address, p_road_address, p_phone, p_category, p_biz, p_data))
        conn.commit()

        print('OK')
    except:
        print('EXCEPTION')


if __name__ == '__main__':
    init(sys.argv)
