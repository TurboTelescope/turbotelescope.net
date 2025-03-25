/**
 * When I started the image health website, I used "locale" when what I actually
 * meant was "timezone." TODO: replace "locale" with "timezone" throughout the
 * app.
 *
 * This component is a dropdown menu that allows the user to select a timezone.
 * By default, the timezone should be set to the timezone of the user's device.
 * Any times referenced in the app (outside of updateFromRx and updateUntilRx)
 * should be in this timezone.
 *
 * The exceptions for updateFromRx and updateUntilRx are intentional. When
 * setting a new time for the range, you can give it any time in any time range.
 * The timezone will then be applied to the datetime without changing the time
 * itself. This approach has serval advantages over tracking everything as a UTC
 * datetime or a Zoned datetime or a Local datetime. And not needing to make
 * sure that the timezone is correct when setting a new from/until rx is
 * important because those times should always come from the calendar and it is
 * easy to forget to offset for the timezone otherwise.
 */

"use client";

import { useRxSet, useRxSuspenseSuccess } from "@effect-rx/rx-react";
import { DateTime } from "effect";

import { localeRx } from "@/components/PipelineHealth/rx";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LocaleSelector() {
    const locale = useRxSuspenseSuccess(localeRx).value;
    const setLocale = useRxSet(localeRx);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <span>Select locale</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup
                    value={DateTime.zoneToString(locale)}
                    onValueChange={(str) => setLocale(str as "UTC" | "America/Chicago")}
                >
                    <DropdownMenuRadioItem value={"UTC"}>Utc</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={"America/Chicago"}>America/Chicago</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
