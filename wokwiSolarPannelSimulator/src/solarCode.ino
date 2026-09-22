#include <Arduino.h>
#include <Wire.h>
#include <stdio.h>
#include <string.h>
#include <WiFi.h>
#include <PubSubClient.h>

#define WIFI_SSID           "Wokwi-GUEST"
#define WIFI_PASSWORD       ""

#define MQTT_SERVER         "broker.hivemq.com"
#define MQTT_PORT           1883
#define MQTT_USER           ""
#define MQTT_PASSWORD       ""

#define ESP_ID              "esp32-01"
#define MQTT_TELEMETRY_TOPIC "powernest/esp32-01/telemetry"

#define SOLAR_POT_PIN       34
#define LOAD_POT_PIN        35
#define BATTERY_POT_PIN     32

#define RELAY_ESSENTIAL     25
#define RELAY_NONESSENTIAL  26

#define OLED1_SDA           21
#define OLED1_SCL           22

#define OLED2_SDA           18
#define OLED2_SCL           19

#define OLED_ADDRESS        0x3C
#define OLED_WIDTH          128
#define OLED_HEIGHT         64

#define RELAY_ON            HIGH
#define RELAY_OFF           LOW

const float SOLAR_MAX_VOLTAGE = 20.0f;
const float SOLAR_MAX_CURRENT = 10.0f;

const float ESSENTIAL_MAX_W = 30.0f;
const float NONESSENTIAL_MAX_W = 50.0f;
const float TOTAL_LOAD_MAX_W = 80.0f;

const float BATTERY_CAPACITY_WH = 100.0f;
const float BATTERY_MIN_VOLTAGE = 11.0f;
const float BATTERY_MAX_VOLTAGE = 14.4f;
const float CHARGING_EFFICIENCY = 0.85f;
const float BATTERY_CRITICAL = 15.0f;

const unsigned long BATTERY_INTERVAL = 500;
const unsigned long OLED_INTERVAL = 500;
const unsigned long MQTT_INTERVAL = 1000;
const unsigned long MQTT_RECONNECT_INTERVAL = 5000;

TwoWire I2C_SOLAR = TwoWire(0);
TwoWire I2C_LOAD = TwoWire(1);

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

uint8_t oledSolarBuffer[OLED_WIDTH * OLED_HEIGHT / 8];
uint8_t oledLoadBuffer[OLED_WIDTH * OLED_HEIGHT / 8];

float sunlightPercent = 0.0f;
float solarVoltage = 0.0f;
float solarCurrent = 0.0f;
float solarPower = 0.0f;

float requestedLoad = 0.0f;
float essentialLoad = 0.0f;
float nonEssentialLoad = 0.0f;
float actualLoad = 0.0f;

float netPower = 0.0f;

float batteryPercent = 0.0f;
float batteryEnergy = 0.0f;
float batteryVoltage = 11.0f;

const char *systemStatus = "NORMAL";

int lastBatteryPot = -1;
const int BATTERY_POT_THRESHOLD = 60;

unsigned long lastBatteryUpdate = 0;
unsigned long lastOLEDUpdate = 0;

float oldSunlight = -1000;
float oldSolarVoltage = -1000;
float oldSolarCurrent = -1000;
float oldSolarPower = -1000;
float oldRequestedLoad = -1000;
float oldEssentialLoad = -1000;
float oldNonEssentialLoad = -1000;
float oldActualLoad = -1000;
float oldNetPower = -1000;
float oldBatteryPercent = -1000;
float oldBatteryEnergy = -1000;
float oldBatteryVoltage = -1000;

String oldStatus = "";

unsigned long lastMQTTPublish = 0;
unsigned long lastMQTTReconnect = 0;

String powerCondition = "SOLAR = LOAD";
String batteryState = "IDLE";
String supplyMode = "SOLAR ONLY";

bool essentialActive = false;
bool nonEssentialActive = false;
bool batteryUsed = false;
bool batteryCharging = false;
bool batteryIdle = true;
bool batteryCritical = true;
bool batteryFull = false;
bool energySaveActive = false;

/*
 * font5x7 layout (0-indexed):
 *   0        -> blank
 *   1  - 10  -> '0' - '9'
 *   11 - 36  -> 'A' - 'Z'
 *   37       -> ' '
 *   38       -> '!'
 *   39       -> '"'
 *   40       -> '#'
 *   41       -> '$'
 *   42       -> '%'
 *   43       -> '&'
 *   44       -> '\''
 *   45       -> '('
 *   46       -> ')'
 *   47       -> '*'
 *   48       -> '+'
 *   49       -> ','
 *   50       -> '-'
 *   51       -> '.'
 *   52       -> '/'
 */

static const uint8_t font5x7[][5] = {
    {0x00,0x00,0x00,0x00,0x00},

    {0x3E,0x51,0x49,0x45,0x3E},
    {0x00,0x42,0x7F,0x40,0x00},
    {0x42,0x61,0x51,0x49,0x46},
    {0x21,0x41,0x45,0x4B,0x31},
    {0x18,0x14,0x12,0x7F,0x10},
    {0x27,0x45,0x45,0x45,0x39},
    {0x3C,0x4A,0x49,0x49,0x30},
    {0x01,0x71,0x09,0x05,0x03},
    {0x36,0x49,0x49,0x49,0x36},
    {0x06,0x49,0x49,0x29,0x1E},

    {0x7E,0x11,0x11,0x11,0x7E},
    {0x7F,0x49,0x49,0x49,0x36},
    {0x3E,0x41,0x41,0x41,0x22},
    {0x7F,0x41,0x41,0x22,0x1C},
    {0x7F,0x49,0x49,0x49,0x41},
    {0x7F,0x09,0x09,0x09,0x01},
    {0x3E,0x41,0x49,0x49,0x7A},
    {0x7F,0x08,0x08,0x08,0x7F},
    {0x00,0x41,0x7F,0x41,0x00},
    {0x20,0x40,0x41,0x3F,0x01},
    {0x7F,0x08,0x14,0x22,0x41},
    {0x7F,0x40,0x40,0x40,0x40},
    {0x7F,0x02,0x0C,0x02,0x7F},
    {0x7F,0x04,0x08,0x10,0x7F},
    {0x3E,0x41,0x41,0x41,0x3E},
    {0x7F,0x09,0x09,0x09,0x06},
    {0x3E,0x41,0x51,0x21,0x5E},
    {0x7F,0x09,0x19,0x29,0x46},
    {0x46,0x49,0x49,0x49,0x31},
    {0x01,0x01,0x7F,0x01,0x01},
    {0x3F,0x40,0x40,0x40,0x3F},
    {0x1F,0x20,0x40,0x20,0x1F},
    {0x7F,0x20,0x18,0x20,0x7F},
    {0x63,0x14,0x08,0x14,0x63},
    {0x03,0x04,0x78,0x04,0x03},
    {0x61,0x51,0x49,0x45,0x43},

    {0x00,0x00,0x00,0x00,0x00},
    {0x00,0x00,0x5F,0x00,0x00},
    {0x00,0x07,0x00,0x07,0x00},
    {0x14,0x7F,0x14,0x7F,0x14},
    {0x24,0x2A,0x7F,0x2A,0x12},
    {0x23,0x13,0x08,0x64,0x62},
    {0x36,0x49,0x55,0x22,0x50},
    {0x00,0x05,0x03,0x00,0x00},
    {0x00,0x1C,0x22,0x41,0x00},
    {0x00,0x41,0x22,0x1C,0x00},
    {0x14,0x08,0x3E,0x08,0x14},
    {0x08,0x08,0x3E,0x08,0x08},
    {0x00,0x50,0x30,0x00,0x00},
    {0x08,0x08,0x08,0x08,0x08},
    {0x00,0x60,0x60,0x00,0x00},
    {0x20,0x10,0x08,0x04,0x02}
};

void i2cWrite(TwoWire &bus, uint8_t control, uint8_t data)
{
    bus.beginTransmission(OLED_ADDRESS);
    bus.write(control);
    bus.write(data);
    bus.endTransmission();
}

void oledCommand(TwoWire &bus, uint8_t command)
{
    i2cWrite(bus, 0x00, command);
}

void oledInit(TwoWire &bus)
{
    delay(100);

    oledCommand(bus, 0xAE);
    oledCommand(bus, 0xD5);
    oledCommand(bus, 0x80);
    oledCommand(bus, 0xA8);
    oledCommand(bus, 0x3F);
    oledCommand(bus, 0xD3);
    oledCommand(bus, 0x00);
    oledCommand(bus, 0x40);
    oledCommand(bus, 0x8D);
    oledCommand(bus, 0x14);
    oledCommand(bus, 0x20);
    oledCommand(bus, 0x00);
    oledCommand(bus, 0xA1);
    oledCommand(bus, 0xC8);
    oledCommand(bus, 0xDA);
    oledCommand(bus, 0x12);
    oledCommand(bus, 0x81);
    oledCommand(bus, 0xCF);
    oledCommand(bus, 0xD9);
    oledCommand(bus, 0xF1);
    oledCommand(bus, 0xDB);
    oledCommand(bus, 0x40);
    oledCommand(bus, 0xA4);
    oledCommand(bus, 0xA6);
    oledCommand(bus, 0xAF);
}

void oledClear(uint8_t *buffer)
{
    memset(
        buffer,
        0,
        OLED_WIDTH * OLED_HEIGHT / 8
    );
}

void oledPixel(
    uint8_t *buffer,
    int x,
    int y,
    bool value
)
{
    if (
        x < 0 ||
        x >= OLED_WIDTH ||
        y < 0 ||
        y >= OLED_HEIGHT
    )
        return;

    int index =
        x + (y / 8) * OLED_WIDTH;

    uint8_t bit =
        1 << (y % 8);

    if (value)
        buffer[index] |= bit;
    else
        buffer[index] &= ~bit;
}

int fontIndex(char c)
{
    if (c >= '0' && c <= '9')
        return c - '0' + 1;

    if (c >= 'A' && c <= 'Z')
        return c - 'A' + 11;

    if (c >= 'a' && c <= 'z')
        return c - 'a' + 11;

    if (c == ' ')
        return 0;

    if (c == '%')
        return 42;

    if (c == '+')
        return 48;

    if (c == '-')
        return 50;

    if (c == '.')
        return 51;

    return 0;
}

void oledChar(
    uint8_t *buffer,
    int x,
    int y,
    char c
)
{
    if (c == ':')
    {
        oledPixel(buffer, x + 2, y + 2, true);
        oledPixel(buffer, x + 2, y + 5, true);
        return;
    }

    int index = fontIndex(c);

    for (int col = 0; col < 5; col++)
    {
        uint8_t line =
            font5x7[index][col];

        for (int row = 0; row < 7; row++)
        {
            if (line & (1 << row))
            {
                oledPixel(
                    buffer,
                    x + col,
                    y + row,
                    true
                );
            }
        }
    }
}

void oledText(
    uint8_t *buffer,
    int x,
    int y,
    const char *text
)
{
    while (*text)
    {
        oledChar(
            buffer,
            x,
            y,
            *text
        );

        x += 6;
        text++;
    }
}

void oledUpdate(
    TwoWire &bus,
    uint8_t *buffer
)
{
    for (uint8_t page = 0; page < 8; page++)
    {
        oledCommand(
            bus,
            0xB0 + page
        );

        oledCommand(bus, 0x00);
        oledCommand(bus, 0x10);

        for (
            int start = 0;
            start < OLED_WIDTH;
            start += 16
        )
        {
            bus.beginTransmission(
                OLED_ADDRESS
            );

            bus.write(0x40);

            for (
                int x = start;
                x < start + 16 &&
                x < OLED_WIDTH;
                x++
            )
            {
                bus.write(
                    buffer[
                        page * OLED_WIDTH + x
                    ]
                );
            }

            bus.endTransmission();
        }
    }
}

void readInputs()
{
    int solarADC =
        analogRead(SOLAR_POT_PIN);

    int loadADC =
        analogRead(LOAD_POT_PIN);

    sunlightPercent =
        (solarADC / 4095.0f) * 100.0f;

    sunlightPercent =
        constrain(
            sunlightPercent,
            0.0f,
            100.0f
        );

    requestedLoad =
        (loadADC / 4095.0f) *
        TOTAL_LOAD_MAX_W;

    requestedLoad =
        constrain(
            requestedLoad,
            0.0f,
            TOTAL_LOAD_MAX_W
        );
}

void calculateSolar()
{
    solarVoltage =
        (sunlightPercent / 100.0f) *
        SOLAR_MAX_VOLTAGE;

    solarCurrent =
        (sunlightPercent / 100.0f) *
        SOLAR_MAX_CURRENT;

    solarPower =
        solarVoltage *
        solarCurrent;
}

void calculateLoad()
{
    essentialLoad =
        min(
            requestedLoad,
            ESSENTIAL_MAX_W
        );

    nonEssentialLoad =
        requestedLoad -
        essentialLoad;

    nonEssentialLoad =
        constrain(
            nonEssentialLoad,
            0.0f,
            NONESSENTIAL_MAX_W
        );

    actualLoad =
        essentialLoad +
        nonEssentialLoad;
}

void updateTelemetryState()
{
    float loadForCondition =
        requestedLoad;

    if (solarPower > loadForCondition + 0.01f)
    {
        powerCondition = "SOLAR > LOAD";
    }
    else if (solarPower < loadForCondition - 0.01f)
    {
        powerCondition = "SOLAR < LOAD";
    }
    else
    {
        powerCondition = "SOLAR = LOAD";
    }

    if (
        netPower > 0.01f &&
        batteryPercent < 99.9f
    )
    {
        batteryState = "CHARGING";
    }
    else if (netPower < -0.01f)
    {
        batteryState = "DISCHARGING";
    }
    else
    {
        batteryState = "IDLE";
    }

    batteryUsed =
        netPower < -0.01f;

    batteryCharging =
        netPower > 0.01f &&
        batteryPercent < 99.9f;

    batteryIdle =
        !batteryUsed &&
        !batteryCharging;

    batteryCritical =
        batteryPercent <= BATTERY_CRITICAL;

    batteryFull =
        batteryPercent >= 99.9f;

    energySaveActive =
        batteryCritical &&
        solarPower < requestedLoad;

    if (actualLoad <= 0.01f)
    {
        supplyMode = "NO LOAD";
    }
    else if (energySaveActive)
    {
        supplyMode = "ESSENTIAL ONLY";
    }
    else if (solarPower >= actualLoad - 0.01f)
    {
        supplyMode = "SOLAR ONLY";
    }
    else
    {
        supplyMode = "SOLAR + BATTERY";
    }

    essentialActive =
        essentialLoad > 0.1f;

    nonEssentialActive =
        nonEssentialLoad > 0.1f &&
        (
            !batteryCritical ||
            solarPower >= requestedLoad
        );
}

String jsonBool(bool value)
{
    return value ? "true" : "false";
}

void connectWiFi()
{
    static unsigned long lastWiFiAttempt = 0;

    if (WiFi.status() == WL_CONNECTED)
        return;

    unsigned long now = millis();

    if (now - lastWiFiAttempt < 5000)
        return;

    lastWiFiAttempt = now;

    WiFi.begin(
        WIFI_SSID,
        WIFI_PASSWORD
    );
}

void connectMQTT()
{
    if (mqttClient.connected())
        return;

    unsigned long now = millis();

    if (now - lastMQTTReconnect < MQTT_RECONNECT_INTERVAL)
        return;

    lastMQTTReconnect = now;

    String clientId =
        String(ESP_ID) +
        "-" +
        String((uint32_t)ESP.getEfuseMac(), HEX);

    bool connected;

    if (MQTT_USER[0] != '\0')
    {
        connected = mqttClient.connect(
            clientId.c_str(),
            MQTT_USER,
            MQTT_PASSWORD
        );
    }
    else
    {
        connected = mqttClient.connect(
            clientId.c_str()
        );
    }

    if (connected)
    {
        Serial.println("MQTT connected");
        Serial.print("MQTT topic: ");
        Serial.println(MQTT_TELEMETRY_TOPIC);
    }
    else
    {
        Serial.print("MQTT connection failed, state: ");
        Serial.println(mqttClient.state());
    }
}

void publishTelemetry(const char *eventName)
{
    if (!mqttClient.connected())
        return;

    float excessSolar =
        max(
            0.0f,
            solarPower - actualLoad
        );

    float powerDeficit =
        max(
            0.0f,
            actualLoad - solarPower
        );

    float batteryPower = 0.0f;

    if (batteryCharging)
    {
        batteryPower =
            (solarPower - actualLoad) *
            CHARGING_EFFICIENCY;
    }
    else if (batteryUsed)
    {
        batteryPower =
            -(actualLoad - solarPower);
    }

    String payload = "{";

    payload += "\"espId\":\"";
    payload += ESP_ID;
    payload += "\",";

    payload += "\"timestamp\":";
    payload += String(millis());
    payload += ",";

    payload += "\"sunlight\":";
    payload += String(sunlightPercent, 1);
    payload += ",";

    payload += "\"solarVoltage\":";
    payload += String(solarVoltage, 2);
    payload += ",";

    payload += "\"solarCurrent\":";
    payload += String(solarCurrent, 2);
    payload += ",";

    payload += "\"solarPower\":";
    payload += String(solarPower, 2);
    payload += ",";

    payload += "\"requestedLoad\":";
    payload += String(requestedLoad, 2);
    payload += ",";

    payload += "\"essentialLoad\":";
    payload += String(essentialLoad, 2);
    payload += ",";

    payload += "\"nonEssentialLoad\":";
    payload += String(nonEssentialLoad, 2);
    payload += ",";

    payload += "\"actualLoad\":";
    payload += String(actualLoad, 2);
    payload += ",";

    payload += "\"netPower\":";
    payload += String(netPower, 2);
    payload += ",";

    payload += "\"excessSolarPower\":";
    payload += String(excessSolar, 2);
    payload += ",";

    payload += "\"powerDeficit\":";
    payload += String(powerDeficit, 2);
    payload += ",";

    payload += "\"powerCondition\":\"";
    payload += powerCondition;
    payload += "\",";

    payload += "\"supplyMode\":\"";
    payload += supplyMode;
    payload += "\",";

    payload += "\"battery\":";
    payload += String(batteryPercent, 1);
    payload += ",";

    payload += "\"batteryEnergy\":";
    payload += String(batteryEnergy, 2);
    payload += ",";

    payload += "\"batteryVoltage\":";
    payload += String(batteryVoltage, 2);
    payload += ",";

    payload += "\"batteryPower\":";
    payload += String(batteryPower, 2);
    payload += ",";

    payload += "\"batteryState\":\"";
    payload += batteryState;
    payload += "\",";

    payload += "\"batteryUsed\":";
    payload += jsonBool(batteryUsed);
    payload += ",";

    payload += "\"batteryCharging\":";
    payload += jsonBool(batteryCharging);
    payload += ",";

    payload += "\"batteryIdle\":";
    payload += jsonBool(batteryIdle);
    payload += ",";

    payload += "\"batteryCritical\":";
    payload += jsonBool(batteryCritical);
    payload += ",";

    payload += "\"batteryFull\":";
    payload += jsonBool(batteryFull);
    payload += ",";

    payload += "\"essentialActive\":";
    payload += jsonBool(essentialActive);
    payload += ",";

    payload += "\"nonEssentialActive\":";
    payload += jsonBool(nonEssentialActive);
    payload += ",";

    payload += "\"energySaveActive\":";
    payload += jsonBool(energySaveActive);
    payload += ",";

    payload += "\"status\":\"";
    payload += systemStatus;
    payload += "\",";

    payload += "\"event\":\"";
    payload += eventName;
    payload += "\"";

    payload += "}";

    bool success = mqttClient.publish(
      MQTT_TELEMETRY_TOPIC,
      payload.c_str()
    );

    if (!success) {
      Serial.println("================================");
      Serial.println("MQTT TELEMETRY PUBLISH FAILED");
      Serial.print("Topic: ");
      Serial.println(MQTT_TELEMETRY_TOPIC);
      Serial.println("================================");
    }
}

void updateBattery(float seconds)
{
    bool critical =
        batteryPercent <= BATTERY_CRITICAL;

    bool full =
        batteryPercent >= 99.9f;

    bool solarCanSatisfyLoad =
        solarPower >= requestedLoad;

    if (
        critical &&
        !solarCanSatisfyLoad
    )
    {
        actualLoad =
            essentialLoad;
    }
    else
    {
        actualLoad =
            essentialLoad +
            nonEssentialLoad;
    }

    netPower =
        solarPower -
        actualLoad;

    if (netPower > 0.01f)
    {
        if (!full)
        {
            float energy =
                netPower *
                seconds /
                3600.0f;

            energy *=
                CHARGING_EFFICIENCY;

            batteryEnergy +=
                energy;

            if (
                batteryEnergy >=
                BATTERY_CAPACITY_WH
            )
            {
                batteryEnergy =
                    BATTERY_CAPACITY_WH;

                systemStatus =
                    "FULL";
            }
            else
            {
                systemStatus =
                    "CHARGING";
            }
        }
        else
        {
            batteryEnergy =
                BATTERY_CAPACITY_WH;

            systemStatus =
                "FULL";
        }
    }
    else if (netPower < -0.01f)
    {
        float energy =
            (-netPower) *
            seconds /
            3600.0f;

        batteryEnergy -=
            energy;

        if (batteryEnergy <= 0.0f)
        {
            batteryEnergy = 0.0f;

            systemStatus =
                "EMPTY";
        }
        else
        {
            systemStatus =
                "DISCHARGING";
        }
    }
    else
    {
        if (
            critical &&
            !solarCanSatisfyLoad
        )
        {
            systemStatus =
                "ENERGY SAVE";
        }
        else
        {
            systemStatus =
                "NORMAL";
        }
    }

    batteryEnergy =
        constrain(
            batteryEnergy,
            0.0f,
            BATTERY_CAPACITY_WH
        );

    batteryPercent =
        (
            batteryEnergy /
            BATTERY_CAPACITY_WH
        ) * 100.0f;

    batteryPercent =
        constrain(
            batteryPercent,
            0.0f,
            100.0f
        );

    updateBatteryVoltage();
}

void updateBatteryVoltage()
{
    batteryVoltage =
        BATTERY_MIN_VOLTAGE +
        (
            batteryPercent / 100.0f *
            (
                BATTERY_MAX_VOLTAGE -
                BATTERY_MIN_VOLTAGE
            )
        );
}

void checkBatteryPot()
{
    int reading =
        analogRead(BATTERY_POT_PIN);

    if (lastBatteryPot < 0)
    {
        lastBatteryPot =
            reading;

        return;
    }

    if (
        abs(
            reading -
            lastBatteryPot
        ) >= BATTERY_POT_THRESHOLD
    )
    {
        batteryPercent =
            (reading / 4095.0f) *
            100.0f;

        batteryPercent =
            constrain(
                batteryPercent,
                0.0f,
                100.0f
            );

        batteryEnergy =
            BATTERY_CAPACITY_WH *
            batteryPercent /
            100.0f;

        updateBatteryVoltage();

        lastBatteryPot =
            reading;
    }
}

void updateRelays()
{
    bool critical =
        batteryPercent <= BATTERY_CRITICAL;

    bool solarCanSatisfyLoad =
        solarPower >= requestedLoad;

    bool essentialON =
        essentialLoad > 0.1f;

    bool nonEssentialON =
        nonEssentialLoad > 0.1f &&
        (
            !critical ||
            solarCanSatisfyLoad
        );

    digitalWrite(
        RELAY_ESSENTIAL,
        essentialON
            ? RELAY_ON
            : RELAY_OFF
    );

    digitalWrite(
        RELAY_NONESSENTIAL,
        nonEssentialON
            ? RELAY_ON
            : RELAY_OFF
    );
}

void updateSolarDisplay()
{
    char line[32];

    oledClear(oledSolarBuffer);

    snprintf(
        line,
        sizeof(line),
        "Sunlight: %d%%",
        (int)sunlightPercent
    );

    oledText(
        oledSolarBuffer,
        0,
        0,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Voltage: %.2f V",
        solarVoltage
    );

    oledText(
        oledSolarBuffer,
        0,
        8,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Current: %.2f A",
        solarCurrent
    );

    oledText(
        oledSolarBuffer,
        0,
        16,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Power: %.2f W",
        solarPower
    );

    oledText(
        oledSolarBuffer,
        0,
        24,
        line
    );

    oledUpdate(
        I2C_SOLAR,
        oledSolarBuffer
    );
}

void updateLoadDisplay()
{
    char line[32];

    oledClear(oledLoadBuffer);

    snprintf(
        line,
        sizeof(line),
        "Load: %.2f W",
        actualLoad
    );

    oledText(
        oledLoadBuffer,
        0,
        0,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Essential: %.2f W",
        essentialLoad
    );

    oledText(
        oledLoadBuffer,
        0,
        8,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "NonEss: %.2f W",
        nonEssentialLoad
    );

    oledText(
        oledLoadBuffer,
        0,
        16,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Battery: %.1f%%",
        batteryPercent
    );

    oledText(
        oledLoadBuffer,
        0,
        24,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Voltage: %.2f V",
        batteryVoltage
    );

    oledText(
        oledLoadBuffer,
        0,
        32,
        line
    );

    snprintf(
        line,
        sizeof(line),
        "Net: %.2f W",
        netPower
    );

    oledText(
        oledLoadBuffer,
        0,
        40,
        line
    );

    oledText(
        oledLoadBuffer,
        0,
        48,
        systemStatus
    );

    oledUpdate(
        I2C_LOAD,
        oledLoadBuffer
    );
}

bool changed(
    float current,
    float previous,
    float threshold
)
{
    return fabs(
        current - previous
    ) >= threshold;
}

void printIfChanged()
{
    bool valueChanged = false;

    if (changed(sunlightPercent, oldSunlight, 0.1f))
        valueChanged = true;

    if (changed(solarVoltage, oldSolarVoltage, 0.01f))
        valueChanged = true;

    if (changed(solarCurrent, oldSolarCurrent, 0.01f))
        valueChanged = true;

    if (changed(solarPower, oldSolarPower, 0.01f))
        valueChanged = true;

    if (changed(requestedLoad, oldRequestedLoad, 0.01f))
        valueChanged = true;

    if (changed(essentialLoad, oldEssentialLoad, 0.01f))
        valueChanged = true;

    if (changed(nonEssentialLoad, oldNonEssentialLoad, 0.01f))
        valueChanged = true;

    if (changed(actualLoad, oldActualLoad, 0.01f))
        valueChanged = true;

    if (changed(netPower, oldNetPower, 0.01f))
        valueChanged = true;

    if (changed(batteryPercent, oldBatteryPercent, 0.01f))
        valueChanged = true;

    if (changed(batteryEnergy, oldBatteryEnergy, 0.01f))
        valueChanged = true;

    if (changed(batteryVoltage, oldBatteryVoltage, 0.01f))
        valueChanged = true;

    if (oldStatus != systemStatus)
        valueChanged = true;

    if (!valueChanged)
        return;

    Serial.println("==============================");

    Serial.print("Sunlight       : ");
    Serial.print(sunlightPercent, 1);
    Serial.println("%");

    Serial.print("Solar Voltage  : ");
    Serial.print(solarVoltage, 2);
    Serial.println(" V");

    Serial.print("Solar Current  : ");
    Serial.print(solarCurrent, 2);
    Serial.println(" A");

    Serial.print("Solar Power    : ");
    Serial.print(solarPower, 2);
    Serial.println(" W");

    Serial.print("Requested Load : ");
    Serial.print(requestedLoad, 2);
    Serial.println(" W");

    Serial.print("Essential Load : ");
    Serial.print(essentialLoad, 2);
    Serial.println(" W");

    Serial.print("Non-Essential  : ");
    Serial.print(nonEssentialLoad, 2);
    Serial.println(" W");

    Serial.print("Actual Load    : ");
    Serial.print(actualLoad, 2);
    Serial.println(" W");

    Serial.print("Net Power      : ");
    Serial.print(netPower, 2);
    Serial.println(" W");

    Serial.print("Battery        : ");
    Serial.print(batteryPercent, 1);
    Serial.println("%");

    Serial.print("Battery Energy : ");
    Serial.print(batteryEnergy, 2);
    Serial.println(" Wh");

    Serial.print("Battery Voltage: ");
    Serial.print(batteryVoltage, 2);
    Serial.println(" V");

    Serial.print("Status         : ");
    Serial.println(systemStatus);

    Serial.println("==============================");

    oldSunlight = sunlightPercent;
    oldSolarVoltage = solarVoltage;
    oldSolarCurrent = solarCurrent;
    oldSolarPower = solarPower;
    oldRequestedLoad = requestedLoad;
    oldEssentialLoad = essentialLoad;
    oldNonEssentialLoad = nonEssentialLoad;
    oldActualLoad = actualLoad;
    oldNetPower = netPower;
    oldBatteryPercent = batteryPercent;
    oldBatteryEnergy = batteryEnergy;
    oldBatteryVoltage = batteryVoltage;
    oldStatus = systemStatus;
}

void setup()
{
    Serial.begin(115200);

    mqttClient.setServer(
        MQTT_SERVER,
        MQTT_PORT
    );

    mqttClient.setBufferSize(4096);

    connectWiFi();

    pinMode(SOLAR_POT_PIN, INPUT);
    pinMode(LOAD_POT_PIN, INPUT);
    pinMode(BATTERY_POT_PIN, INPUT);

    pinMode(RELAY_ESSENTIAL, OUTPUT);
    pinMode(RELAY_NONESSENTIAL, OUTPUT);

    digitalWrite(
        RELAY_ESSENTIAL,
        RELAY_OFF
    );

    digitalWrite(
        RELAY_NONESSENTIAL,
        RELAY_OFF
    );

    I2C_SOLAR.begin(
        OLED1_SDA,
        OLED1_SCL,
        400000
    );

    I2C_LOAD.begin(
        OLED2_SDA,
        OLED2_SCL,
        400000
    );

    oledInit(I2C_SOLAR);
    oledInit(I2C_LOAD);

    batteryPercent = 0.0f;
    batteryEnergy = 0.0f;
    batteryVoltage = BATTERY_MIN_VOLTAGE;

    lastBatteryPot =
        analogRead(BATTERY_POT_PIN);

    updateBatteryVoltage();

    lastBatteryUpdate =
        millis();

    lastOLEDUpdate =
        millis();

    readInputs();
    calculateSolar();
    calculateLoad();

    updateSolarDisplay();
    updateLoadDisplay();

    printIfChanged();
}

void loop()
{
    unsigned long now =
        millis();

    if (WiFi.status() != WL_CONNECTED)
        connectWiFi();

    connectMQTT();

    if (mqttClient.connected())
        mqttClient.loop();

    readInputs();

    checkBatteryPot();

    calculateSolar();

    calculateLoad();

    if (
        now -
        lastBatteryUpdate >=
        BATTERY_INTERVAL
    )
    {
        float seconds =
            (
                now -
                lastBatteryUpdate
            ) / 1000.0f;

        lastBatteryUpdate =
            now;

        updateBattery(seconds);
    }

    updateRelays();

    updateTelemetryState();
    if (
        now -
        lastOLEDUpdate >=
        OLED_INTERVAL
    )
    {
        lastOLEDUpdate =
            now;

        updateSolarDisplay();
        updateLoadDisplay();
    }

    if (
        mqttClient.connected() &&
        now - lastMQTTPublish >= MQTT_INTERVAL
    )
    {
        lastMQTTPublish = now;
        publishTelemetry("PERIODIC");
    }

    printIfChanged();

    delay(20);
}


