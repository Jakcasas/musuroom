$ErrorActionPreference='Stop'
$projectPath=Split-Path -Parent $PSScriptRoot
$privatePath=Join-Path $projectPath 'data\cloud.env'
if(-not(Test-Path -LiteralPath $privatePath)){throw 'Private data/cloud.env is missing. Use the deployment guide first.'}
Write-Host 'Musuroom 1 - ket noi Supabase Singapore'
Write-Host 'Nhap mat khau DATABASE da dat khi tao Supabase project.'
Write-Host 'Day khong phai mat khau email. Ky tu nhap se duoc an.'
$databaseSecret=Read-Host 'Mat khau database' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($databaseSecret)
try{
 $plainSecret=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
 if([string]::IsNullOrWhiteSpace($plainSecret)){throw 'Password is empty. No file changed.'}
 $encodedSecret=[Uri]::EscapeDataString($plainSecret)
 $connection='postgresql://postgres.hlkzngyuoqzcfhrfkuub:'+ $encodedSecret +'@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
 $text=[IO.File]::ReadAllText($privatePath)
 if($text -notmatch '(?m)^DATABASE_URL='){throw 'DATABASE_URL entry is missing. No file changed.'}
 $text=[regex]::Replace($text,'(?m)^DATABASE_URL=[^\r\n]*',$connection.Insert(0,'DATABASE_URL='))
 [IO.File]::WriteAllText($privatePath,$text,[Text.UTF8Encoding]::new($false))
 Write-Host 'Da luu ket noi rieng tu. Mat khau khong hien thi va khong gui vao chat.'
}finally{
 [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
 $plainSecret=$null;$encodedSecret=$null;$connection=$null;$text=$null
 $databaseSecret.Dispose()
}
