# Android Security


## Android Risks

The risks can be summarized as:
* Enterprise Data on phones, such as email, passwords and so on...
* Poorly written apps with debugging capabilities enabled
* Library dependencies with vulnerabilities
* Malicious apps in the marketplace, with side jacking and resigning of
  legitimate apps
* Can affect a large number of people


## Android Internals

In Android there is a mechanism for IPC which can be thought as a sort of
"Universal Interprocess Communication" based on the concept of **intent**.
This model can be thought as a sort of messaging system which allow apps 
and the other parts of the operating system to communicate.

We can think about **intent**s as elements which can be used to:
- start an "activity"
- start a "device"
- deliver a "broadcast" message

So if an application wants to access a certain resource (e.g., wifi) it will
send an intent to the operating system, and then the operating system will deal
with the intent.

Anyway there are certain apps as said who also broadcast intents.

Consider also that apps should properly fiilter the intents they can manage, and
sometimes sending them intents which are not expected can make them crash.


## Android Application Security

Generally the methodology for testing Android applications can be summarized
into three major steps:
1. File System behavior
2. Network behavior
3. Application specific issues

## Tools

### Must-Have

* Jadx, Android Java (dex) decompiler
* Android Studio + Emulator
* AXMLPrinter2.jar, XML manifest extractor
* Drozer, software to look at Android internals
* A rooted device, (generally nexus or motorale are easy to root)

### Nice-to-Have

* Genymotion (not free)
* MobSF (automated dynamic and static malware analysis)

### Configuration of the Emulator

Using Android Studio, choose an android to emulate, generally good choices are:
* Pixel2 variety
* Nexus variety
And an OS version, here, keep in mind the market share, a good choice as of 2019
is anything from 6 to 8.1.
Intercepting TLS traffic through a proxy is trickier after 6.0.

Anyway we can still MiTM by importing the certificate of our intercepting proxy as
a root certificate in the certificate store of the device.

## ADB

ADB "Android Debug Bridge" is an android debugger, and this allows us to interact 
with the attached devices. Common commands used are:

```sh
adb devices 
# lists devices and their info
```

```sh
adb root
# starts root mode, so that if we launch a shell 
# or want to copy protected files we have root privileges
```

```sh
adb shell   
# gets a shell on the device
# notice that we will have root privileges only if we had launched
# adb root before
```
```sh
adb push /source/file /destination/on/android/device
# pushes a portion of the filesystem
# copy files/dirs from laptop to device
```
```sh
adb pull /path/on/AndroidPhone/ /local/destination 
# pulls a portion of the filesystem
# copy files/dirs from device to laptop
```

```sh
adb install <apkpackage>.apk
# used to install apks onto the device
```

```sh
adb logcat
# used to show system logs
```

```sh
adb forward tcp:31415 tcp:31415
# forwards localhost port 31415 on the android device on port 31415
```

```sh
adb forward --list
# lists all forwarded sockets
```

Note that pushing and pulling may be very useful, since we could check the
difference in the files before and after we have launched an application.
This is done by analyzing all the differences between consecutive app launches.
So this is an activity we will find ourselves doing a lot, since we want to
check what changes on the filesystem when we do specific operations or
enable/disable specific configuration with the app.




## Managing Packages

### Finding Packages

We can find packages outside of google play by using:
[apkmirror](apkmirror.com)
[apkmonk](apkmonk.com)


### Copy APK file from a device

Most applications are installed in:
- `/system/app/<app_package_name>`

And store their data in:
- `/data/data/com.<package_name>`


We can list all the packages installed on Android by doing:
```sh
adb shell 'pm list packages -f'
```
or after entering the shell just doing:
```sh
pm list packages -f
```
we can also grep to find only interesting packages.

Once we have the list we can pick up the one we are interested in, let's say for
example `com.android.calculator2` and do:
```sh
adb shell pm path com.android.calculator2
```
Now that we have the path we can also remove the application, this is
particularly useful to remove bloatware and pre-installed applications, by
doing:
```sh
rm -rf <path>
# where path is the path found out by the pm path command
# notice that this command must be launched from the adb shell
```
Also notice that in order to perform a -rf we must first remount the filesystem
in rw if we have any read-only filesystem errors (this is common).

We can remount in rw by doing:
```sh
adb root
mount -o rw,remount /system
# double check this procedure
```

At this point we will have the path to the apk of the applications, and now we
can copy on our local file system the apk by doing:
```sh
adb pull /data/app/<package_name>.apk <optionalDestinationOnLocalMachine>
# this copies the apk to our local machine
# if we do not specify a location, the file is copied in the current directory
```

Remember that these `.apk` files are just JAR, so basically they are ZIP files
that we can unzip and look how they are built inside.

Inside these files we will generally find the xml manifest, which is called
`AndroidManifest.xml` but this is in a binary format so in order to read it we
will need an application like `AXMLPrinter2.jar`.

Consider that a manifest contains a lot of information since it is used to:
- declare the app name
- declare all the components of the app
- includes declaration of all:
    - activities
    - broadcast receivers
    - services
- declare permissions the app needs
- declare hardware/software features needed

so we should always look the manifest!

So to convert the binary manifest file to plain text we can do:
```sh
java -jar AXMLPrinter2.jar AndroidManifest.xml
```


## Drozer Fuzzing

Drozer is a famous framework used for Android assessments, it consists of an
agent running on Android with a console running on the pentesting machine, it
communicates via TCP with android through localhost forwarded port 31415.

Drozer has various modules to examine the applications and sends various stimuli
to the application under examination as needed.

To start a session we can do:
```sh
adb forward tcp:31415 tcp:31415
drozer console connect
```

## JADX

This software is used to decompile/deconstruct DEX files into Java source.
Basically DEX files contain bytecode which will be executed by the Dalvik JVM
on android, anyway this bytecode is not readable.
So developers invented a more human-readable language (which resembles a sort of
assembly) in which DEX files can be converted for analysis.


Remember that Android programs are compiled into .dex (Dalvik Executable) files, 
which are in turn zipped into a single .apk file on the device. 
.dex files can be created automatically by Android, by translating the compiled 
applications written in the Java programming language.

Generally the decompilation process is quite reliable, unless the developers
used some obfuscation technique. Anyway nobody develops using obfuscation on
Android at the moment.

Once we have decompiled it we can search for interesting things such as:
* Intent communications method calls
* Dangerous network class use
* SMS Manager use
* Contacts/Address Book access


We can perform a search for text or class.


### Once Decompiled

Once our application is decompiled we should search the code for:
- interesting function names
- intents/receivers
    - `getExtra`, to get extra data
    - `putExtra`, to put extra data
    - `ACTION_CALL` - make phone call
    - `getCellLocation`
    - `LocationManager`
    - `ProcessBuilder`, to run local processes
- Find sections of code for Intent and try to manipulate it with Drozer

For example we can manipulate with drozer a certain activity by doing from the
drozer shell:
```drozer
run app.activity.start --component <activity_name> -- data-uri "data to pass to app"
```

## Embedding malware into APKs

Let's see an overview of steps that can be taken to embed APK into another APK,
and hence embed a malware/backdoor inside an APK:
- download an APP to jack (apkmonk.com)
- generate a metasploit apk file
  (either `android/meterpreter/reverse_tcp` or
  `android/meterpreter/reverse_https`)
- use "apktool" to disassemble both APKs into "smali" assembly
- copy metasploit stager code into APP being "enhanced"
- locate and adjust "MAIN" entry point code
- adjust "AndroidManifest.xml" privileges
- Re-assemble the new edited "smali" code into APK
- Re-sign resulting APK with out own certificate
- Upload to Android system and profit


** Finding the Main Activity **
Remember that in order to find the APP entry point we can look for the
"intent-filter" with "android.intent.action.MAIN" and "android:name" attribute
contains the main activity.


** Modify Main Activity ".smali" file **

Here the "oCreate" method in the "MainActivity.smali" is the app entry point. We
can add an "invoke-static" linee to invoke out Metasploit payload.

Then we have to copy all of the "smali/com/metasploit/stage" over the APK
directory structure we are modifying.
We cann copy ALL of the "<uses-permission>", and "<uses-feature>" lines from the
metasploit APK.

Once we have done that, we can reassemble all of the code by doing:
```sh
apktool b originaldir

cp originaldir/dist/com.appName.apk ~/final.apk

jarsigner -verbose -keystore debug.keystore \
-storepass android -keypass android \
-digestalg SHA1 -sigalg SHA1withRSA \
final.apk androiddebugkey
```

Anyway all of these steps can be automated with a tool that can be found here:
[AndroidEmbedIT](github.com/yoda66/AndroidEmbedIT)


## Other tools

jadx
MobSF, automated apk,ipa pentest and analysis
Frida
Android Tamer (android platform)


[Fun with Frida on Mobile](https://www.youtube.com/watch?v=dqA38-1UMxI)
[Demistifying Frida](https://www.youtube.com/watch?v=kd05JjCqViY)


