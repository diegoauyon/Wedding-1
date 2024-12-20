import type { APIRoute } from "astro";
export const prerender = false;

import {
  MAILGUN_API_URL,
  MAILGUN_DOMAIN,
  FROM_EMAIL_ADDRESS,
  TO_EMAIL_ADDRESS,
  getSecret,
} from "astro:env/server";

const MAILGUN_API_KEY = getSecret("MAILGUN_API_KEY");

export const POST: APIRoute = async ({ request }) => {
  if (
    !MAILGUN_API_KEY ||
    !FROM_EMAIL_ADDRESS ||
    !TO_EMAIL_ADDRESS ||
    !MAILGUN_API_URL
  )
    return Response.json({
      error: "Missing Mailgun configuration, please check your .env file.",
    });

  const { email, name, message, topicEmail } = await request.json();
  if (!email || email === "") return Response.json({ error: "Missing email" });
  const authHeader =
    "Basic " + Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/x-www-form-urlencoded",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    Authorization: authHeader,
  };

  let payload = new URLSearchParams();

  payload.append("from", FROM_EMAIL_ADDRESS);
  payload.append("to", topicEmail ? topicEmail : TO_EMAIL_ADDRESS);
  payload.append("h:Reply-To", email);
  payload.append("subject", `Contact Form: ${name} ${email}`);
  payload.append("text", message);

  try {
    const resp = await fetch(
      `${MAILGUN_API_URL}/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: headers,
        body: payload,
      },
    );

    let response = await resp.json();

    return Response.json({
      statusCode: resp?.ok ? 200 : response.ErrorCode,
      status: resp?.ok ? "ok" : "error",
      body: resp?.ok
        ? "Your message was sent successfully! We'll be in touch."
        : response.Message,
    });
  } catch (error) {
    console.debug(error);
    return new Response(
      JSON.stringify({
        message: "error",
      }),
      {
        status: 500,
      },
    );
  }
};
