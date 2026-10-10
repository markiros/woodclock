SAVER   := build/Release/WoodClock.saver
DEST    := $(HOME)/Library/Screen Savers

.PHONY: all project build install uninstall presets clean log

all: build

project:
	xcodegen generate

build: project
	xcodebuild -project WoodClock.xcodeproj -target WoodClock -configuration Release \
		SYMROOT=$(CURDIR)/build ARCHS="arm64 x86_64" ONLY_ACTIVE_ARCH=NO -quiet

install: build
	rm -rf "$(DEST)/WoodClock.saver"
	mkdir -p "$(DEST)"
	cp -R $(SAVER) "$(DEST)/"
	-killall legacyScreenSaver "legacyScreenSaver (Wallpaper)" WallpaperAgent "System Settings" 2>/dev/null
	@echo "Установлено: $(DEST)/WoodClock.saver"

uninstall:
	rm -rf "$(DEST)/WoodClock.saver"
	-killall legacyScreenSaver "legacyScreenSaver (Wallpaper)" WallpaperAgent 2>/dev/null

# Лог скринсейвера: открыть «Параметры…» и смотреть, что пишет WoodClock
log:
	log stream --style compact --predicate 'subsystem == "com.mark.WoodClock" OR (process BEGINSWITH "legacyScreenSaver" AND eventMessage CONTAINS[c] "woodclock")'

# Перерендер PNG-слоёв из tools/dial.js (нужны python3, pillow, playwright + шрифты Bodoni Moda, Cormorant Garamond и Orbitron)
presets:
	python3 tools/render.py WoodClock/Presets

clean:
	rm -rf build WoodClock.xcodeproj
