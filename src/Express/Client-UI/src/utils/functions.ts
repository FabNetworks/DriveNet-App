export function CarNumberSort(a: string | number, b: string | number): number {
    const aNum = Number.parseInt((a as string).replace('CAR', ''), 10);
    const bNum = Number.parseInt((b as string).replace('CAR', ''), 10);

    return aNum - bNum;
}

export async function RequestWithAuthHandler(url: string, token: string, tokenRefreshHandler?: () => Promise<string>, method: string = 'GET', body?: {[s: string]: any}): Promise<any> {
    const headers = new Headers();
    headers.append('Authorization', 'Bearer ' + token);
    headers.append('Accept', 'application/json');

    if (body) {
      headers.append('Content-Type', 'application/json');
    }

    const response = await fetch(url, {method, headers, body: JSON.stringify(body)});

    const responseStatus = response.status.toString();

    if (responseStatus === '401' && tokenRefreshHandler) {
        const newToken = await tokenRefreshHandler();
        return await RequestWithAuthHandler(url, newToken, undefined, method, body);
    } else if (!responseStatus.startsWith('2')) {
      console.error('Error from URL', url, responseStatus, await response.text());

      throw new Error('Error from URL ' + url);
    }

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.indexOf("application/json") !== -1) {
        return await response.json();
    }

    return;
  }