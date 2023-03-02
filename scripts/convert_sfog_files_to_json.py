import fileinput
from pathlib import Path

### This file will read all files with no file extension and print from each of them as part of a JSON array of Songs
### The resulting output will have trailing commas, which may be problematic for some JSON renderings. These can be easily
### removed by using online tools such as  https://jsonformatter.org/
def printSong(filename):
    metaDataSection = True
    print("{")
    f = open(filename, 'r', encoding="UTF-8")

    for line in f:
        if (metaDataSection):
            if (line == '\n'):
                metaDataSection = False
                firstVerse = True
                print("\"lyrics\": {")
                continue
            elif (line.startswith(".")):
                # Parse metadata and create JSON properties and values
                metadata = line.split(": ")
                key = metadata[0][1:].strip().lower()
                value = metadata[1].strip()
                if (key == "title"):
                    # title is expected to have format: {songNumber} - {songTitle}
                    songNumber = value.split("-")[0].strip()
                    print("\"songNumber\": " + songNumber + ",")
                    value = value.split("-")[1].strip()
                print("\"" + key + "\": \"" + value + "\",")
        else:
            if (line.startswith("[")):
                if (not firstVerse):
                    print("],")
                verseName = line.strip().lower().replace("[", "").replace("]", "")
                print("\"" + verseName + "\": [")
                firstVerse = False
            elif (line.strip().startswith(".")):
                continue
            else:
                print("\"" + line.strip().replace("\"", "\\\"") + "\",")
    print("]")
    print("}},")

print("{\"Songs For Our Generation\": [")
open_files = Path(".").glob('*-*')
for file in open_files:
    printSong(file)
print("]")
print("}")
