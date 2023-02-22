import json
import urllib.request
import uuid
import requests

url = 'https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/metadata/shl.json'

with urllib.request.urlopen(url) as response:
    json_data = response.read().decode()
    items = json.loads(json_data)

songs = items['Songs and Hymns of Life']

for song in songs:
    id = str(uuid.uuid4())
    songbookId = 'shl'
    title = song['title']
    number = song['songNumber']
    author = song['author']
    music = song['music']
    presentationOrder = song['presentation']
    imageUrl = f"https://raw.githubusercontent.com/Church-Life-Apps/Resources/master/resources/images/shl/SHL_{number}.png"    
    # call create song api

    headers = {'Content-Type': 'application/json'}
    data = {'id':id, 'songbookId':songbookId, 'title': title, 'number': number, 'author': author, 'music': music, 'presentationOrder': presentationOrder, 'imageUrl': imageUrl}
    print(f"Inserting Song {number}")
    requests.post('http://localhost:3000/createsong',headers=headers, data = json.dumps(data));
   
    
    lyrics = song['lyrics']    

    for verse in lyrics:
        lines = lyrics[verse] 
        newLyric = "\n".join(lines) 
        songId = id
        verseType = verse[0]
        if (verseType == 'c'):
            lyricType = 'LYRIC_TYPE_CHORUS'
        elif (verseType == 'p'):
            lyricType = 'LYRIC_TYPE_PRECHORUS'
        elif (verseType == 'b'):
            lyricType = 'LYRIC_TYPE_BRIDGE'
        else:
            lyricType = 'LYRIC_TYPE_VERSE'
        verseNumber = verse[1]
        print(f"Inserting lyrics for {verse}")
        data = {'songId': songId, 'lyricType': lyricType, 'verseNumber': verseNumber, 'lyrics': newLyric}
        requests.post('http://localhost:3000/createlyric', headers=headers, data = json.dumps(data));
        #call lyrics api
    

    

print("All done!")


