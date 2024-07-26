Get-ChildItem sounds\*.mp3 | ForEach-Object {
    $outputFile = "sounds/normalized/$($_.Name)"
    ffmpeg -i $_.FullName -filter:a loudnorm -c:a libmp3lame -b:a 192k $outputFile
}