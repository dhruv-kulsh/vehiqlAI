"use client"

import { z } from "zod";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardAction,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, Upload, X } from "lucide-react"
import { useDropzone } from 'react-dropzone'
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { addCar, processCarImageWithAI } from "@/actions/cars";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const fuelType = ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"]
const transmission = ["Automatic", "Manual", "Semi-Automatic"]
const bodyTypes = [
    "SUV",
    "Sedan",
    "Hatchback",
    "Convertible",
    "Coupe",
    "Wagon",
    "Pickup",
];
const carStatus = ["AVAILABLE", "UNAVAILABLE", "SOLD"];


const AddCarForm = () => {

    const router = useRouter();

    const [uploadedImages, setUploadedImages] = useState([]);
    const [imageError, setImageError] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadedAiImage, setUploadedAiImage] = useState(null);

    const carFormSchema = z.object({
        make: z.string().min(1, "Make is reuired"),
        model: z.string().min(1, "Model is reuired"),
        year: z.string().refine((val) => {
            const year = parseInt(val);
            return (
                !isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1
            );
        }, "Valid Year Required"),
        price: z.string().min(1, "Price is required"),
        mileage: z.string().min(1, "Mileage is required"),
        color: z.string().min(1, "Color is required"),
        fuelType: z.string().min(1, "fuelType is required"),
        transmission: z.string().min(1, "transmission is required"),
        bodyType: z.string().min(1, "Body type is required"),
        seats: z.string().optional(),
        description: z.string().min(10, "Desctiption must be of 10 characters"),
        status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]),
        featured: z.boolean().default(false)
    })

    const {
        register,
        setValue,
        getValues,
        formState: { errors },
        handleSubmit,
        watch
    } = useForm({
        resolver: zodResolver(carFormSchema),
        defaultValues: {
            make: "",
            model: "",
            year: "",
            price: "",
            mileage: "",
            color: "",
            fuelType: "",
            transmission: "",
            bodyType: "",
            seats: "",
            description: "",
            status: "AVAILABLE",
            featured: false
        }
    });

    const onAiDrop = useCallback(acceptedFiles => {
        console.log(acceptedFiles);

        const file = acceptedFiles[0];

        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                return toast.error("Image size must be less than 50MB")
            }

            setUploadedAiImage(file)

            const reader = new FileReader()
            reader.onload = (e) => {
                console.log(reader);

                setImagePreview(e.target.result);
                toast.success("Image uploaded successfully")
            }


            reader.readAsDataURL(file)
        }
    }, [])

    const {
        getRootProps: getAiRootProps,
        getInputProps: getAiInputRootProps
    } =
        useDropzone({
            onDrop: onAiDrop,
            accept: {
                "image/*": [".jpeg", ".jpg", ".png", ".webp"]
            },
            maxFiles: 1,
            multiple: false,
        });

    const {
        loading: processImageLoading,
        fn: processImageFn,
        data: processImageResult,
        error: processImageError
    }
        = useFetch(processCarImageWithAI);



    const processWithAi = async () => {
        if (!uploadedAiImage) {
            toast.error("please upload image first");
            return;
        }
        try {
            console.log("calling processImageFn with uploadedAiImage:", uploadedAiImage);
            const res = await processImageFn(uploadedAiImage);
            console.log("processImageFn resolved:", res);
        } catch (err) {
            console.error("processImageFn error:", err);
            // show toast handled by useFetch, but also show a debug toast
            toast.error(err?.message || "Failed to process image with AI");
        }
    }

    useEffect(() => {
        if (processImageError) {
            toast.error(processImageError.message || "Failed to upload car")
        }
    }, [processImageError]);


    useEffect(() => {
        if (processImageResult?.success) {

            const carDetails = processImageResult.data;

            setValue("make", carDetails.make);
            setValue("model", carDetails.model);
            setValue("year", carDetails.year.toString());
            setValue("color", carDetails.color);
            setValue("bodyType", carDetails.bodyType);
            setValue("fuelType", carDetails.fuelType);
            setValue("price", carDetails.price);
            setValue("mileage", carDetails.mileage);
            setValue("transmission", carDetails.transmission);
            setValue("description", carDetails.description);

            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImages((prev) => [...prev, e.target.result])
            };

            reader.readAsDataURL(uploadedAiImage);

            toast.success("Successfully extracted car details", {
                description: `Detecteted ${carDetails.year} ${carDetails.make} ${carDetails.model}
                with ${Math.round(carDetails.confidence * 100)}% confidence `
            })
        }
    }, [processImageResult, uploadedAiImage])

    const {
        data: addCarResult,
        loading: addCarLoading,
        fn: addCarFn
    } = useFetch(addCar);

    useEffect(() => {
        if (addCarResult?.success) {
            toast.success("car added successfullly")
            router.push("/admin/cars")
        }
    }, [addCarResult, addCarLoading])

    const onSubmit = async (data) => {
        if (uploadedImages.length === 0) {
            setImageError("Please upload at least one image");
            return;
        }

        const carData = {
            ...data,
            year: parseInt(data.year),
            price: parseFloat(data.price),
            mileage: parseInt(data.mileage),
            seats: data.seats ? parseInt(data.seats) : null
        }
        console.log(carData, uploadedImages);

        await addCarFn({ carData, images: uploadedImages })

    }

    const onMultiImageDrop = (acceptedFiles) => {
        const validFiles = acceptedFiles.filter((file) => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} exceeds 5MB limit and will be skipped`)
                return false;
            }
            return true;
        })

        if (validFiles.length == 0) return;

        const newImages = [];
        validFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                newImages.push(e.target.result)

                if (newImages.length === validFiles.length) {
                    setUploadedImages((prev) => [...prev, ...newImages])
                    setImageError("")
                    toast.success(`successfully uploaded ${validFiles.length} images`)
                }
            }
            reader.readAsDataURL(file);
        })

    }

    const {
        getRootProps: getMultiImageRootProps,
        getInputProps: getMultiImageInputProps
    } =
        useDropzone({
            onDrop: onMultiImageDrop,
            accept: {
                "image/*": [".jpeg", ".jpg", ".png", ".webp"]
            },
            multiple: true,
        })

    const removeImage = (index) => {
        setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    }

    return (
        <div>

            <Tabs
                defaultValue="ai"
                className="mt-6"
            // value={activeTab}
            // onValueChange={setActiveTab}
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual" >Manual Entry</TabsTrigger>
                    <TabsTrigger value="ai" >AI Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Car Details</CardTitle>
                            <CardDescription>Enter the details of the car you want to add</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="make">Make</Label>
                                        <Input
                                            id="make"
                                            {...register("make")}
                                            placeholder="e.g. Toyota"
                                            className={errors.make ? "border-red-400" : ""}
                                        />
                                        {errors.make && (
                                            <p className="text-xs text-red-500">
                                                {errors.make.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="model">Model</Label>
                                        <Input
                                            id="model"
                                            {...register("model")}
                                            placeholder="e.g. Camry"
                                            className={errors.model ? "border-red-400" : ""}
                                        />
                                        {errors.model && (
                                            <p className="text-xs text-red-500">
                                                {errors.model.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="year">Year</Label>
                                        <Input
                                            id="year"
                                            {...register("year")}
                                            placeholder="e.g. 2026"
                                            className={errors.year ? "border-red-400" : ""}
                                        />
                                        {errors.year && (
                                            <p className="text-xs text-red-500">
                                                {errors.year.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input
                                            id="price"
                                            {...register("price")}
                                            placeholder="e.g. 25000"
                                            className={errors.price ? "border-red-400" : ""}
                                        />
                                        {errors.price && (
                                            <p className="text-xs text-red-500">
                                                {errors.price.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mileage">Mileage</Label>
                                        <Input
                                            id="mileage"
                                            {...register("mileage")}
                                            placeholder="e.g. 15000"
                                            className={errors.mileage ? "border-red-400" : ""}
                                        />
                                        {errors.mileage && (
                                            <p className="text-xs text-red-500">
                                                {errors.mileage.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Color</Label>
                                        <Input
                                            id="color"
                                            {...register("color")}
                                            placeholder="e.g. Blue"
                                            className={errors.color ? "border-red-400" : ""}
                                        />
                                        {errors.color && (
                                            <p className="text-xs text-red-500">
                                                {errors.color.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fuelType">Fuel Type</Label>
                                        <Select
                                            onValueChange={value => setValue("fuelType", value)}
                                            defaultValue={getValues("fuelType")}
                                        >
                                            <SelectTrigger
                                                className={errors.fuelType ? "border-red-500" : ""}
                                            >
                                                <SelectValue placeholder="Select Fuel Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {fuelType.map((type) => {
                                                    return (<SelectItem value={type} key={type}>{type}</SelectItem>)

                                                })}
                                            </SelectContent>
                                        </Select>
                                        {errors.fuelType && (
                                            <p className="text-xs text-red-500">
                                                {errors.fuelType.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="transmission">Transmission</Label>
                                        <Select
                                            onValueChange={value => setValue("transmission", value)}
                                            defaultValue={getValues("transmission")}
                                        >
                                            <SelectTrigger
                                                className={errors.transmission ? "border-red-500" : ""}
                                            >
                                                <SelectValue placeholder="Select Transmissoin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {transmission.map((type) => {
                                                    return (<SelectItem value={type} key={type}>{type}</SelectItem>)

                                                })}
                                            </SelectContent>
                                        </Select>
                                        {errors.transmission && (
                                            <p className="text-xs text-red-500">
                                                {errors.transmission.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bodyType">Body Type</Label>
                                        <Select
                                            onValueChange={value => setValue("bodyType", value)}
                                            defaultValue={getValues("bodyType")}
                                        >
                                            <SelectTrigger
                                                className={errors.bodyType ? "border-red-500" : ""}
                                            >
                                                <SelectValue placeholder="Select Body Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bodyTypes.map((type) => {
                                                    return (<SelectItem value={type} key={type}>{type}</SelectItem>)

                                                })}
                                            </SelectContent>
                                        </Select>
                                        {errors.bodyType && (
                                            <p className="text-xs text-red-500">
                                                {errors.bodyType.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="seats">
                                            Number of Seats{" "}
                                            <span className="text-sm text-gray-500">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="seats"
                                            {...register("seats")}
                                            placeholder="e.g. 5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            onValueChange={value => setValue("status", value)}
                                            defaultValue={getValues("status")}
                                        >
                                            <SelectTrigger
                                                id="status"
                                                className={errors.status ? "border-red-500" : ""}
                                            >
                                                <SelectValue placeholder="Select Body Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {carStatus.map((stat) => {
                                                    return (<SelectItem value={stat} key={stat}>
                                                        {stat.charAt(0) + stat.slice(1).toLocaleUpperCase()}
                                                    </SelectItem>)

                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        {...register("description")}
                                        placeholder="Enter the detailed description of car.."
                                        className={`min-h-32 ${errors.description ? "border-red-500" : ""
                                            }`}
                                    />
                                    {errors.description && (
                                        <p className="text-xs text-red-500">
                                            {errors.description.message}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <Checkbox
                                        checked={watch("featured")}
                                        onCheckedChange={(checked) => {
                                            setValue("featured", checked)
                                        }}
                                    />
                                    <div className="space-y-1 leading-none">
                                        <label htmlFor="featured">Feature this car</label>
                                        <p className="text-sm text-gray-500">Featured cars appear on the homepage</p>
                                    </div>
                                </div>

                                <div>
                                    <Label
                                        htmlFor="images"
                                        className={imageError ? "text-red-500" : ""}
                                    >
                                        Images{""}
                                        {imageError && <span className="text-red-500">*</span>}
                                    </Label>
                                    <div {...getMultiImageRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center
                                      cursor-pointer hover:bg-gray-50 transition mt-2 
                                      ${imageError ? "border-red-500" : "border-gray-500"
                                            }`}>

                                        <input {...getMultiImageInputProps()} />
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="h-12 w-12 text-gray-400 mb-3" />
                                            <p className="text-sm text-gray-500 mb-2">
                                                Drag & drop or clcik to upload multiple images
                                            </p>

                                            <p className="text-gray-500 text-sm mt-1">Supports: JPG, PNG, WebP (max 5MB)</p>
                                        </div>
                                    </div>
                                    {imageError && (
                                        <p className="text-xs text-red-500 mt-1">{imageError}</p>
                                    )}
                                </div>
                                {uploadedImages.length > 0 && (
                                    <div className="mt-4">
                                        <h3 className="text-sm font-medium mb-2">Uploaded Images {uploadedImages.length}</h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {uploadedImages.map((image, index) => {
                                                return (
                                                    <div key={index} className="relative group">
                                                        <Image
                                                            src={image}
                                                            alt={`Car image ${index + 1}`}
                                                            height={50}
                                                            width={50}
                                                            className="h-28 w-full object-cover rounded-md"
                                                            priority
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="destructive"
                                                            className="absolute top-1 right-1 h-6 w-6 
                                                            pacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeImage(index)}
                                                        >
                                                            <X className="h-3 w-3" />

                                                        </Button>

                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full md:w-auto"
                                    disabled={addCarLoading}
                                >{
                                        addCarLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            </>
                                        ) : "Add Car"
                                    }</Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="ai" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI-Powered Car Details Extraction</CardTitle>
                            <CardDescription>
                                Upload an image of a car and let AI extract its details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                    {imagePreview ? <div className="flex flex-col items-center">
                                        <img src={imagePreview} alt="Car Preview" className="max-h-56 max-w-full object-contain mb-4" />
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => {
                                                setImagePreview(null)
                                                setUploadedAiImage(null)
                                            }}>
                                                Remove
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={processWithAi}
                                                disabled={processImageLoading}
                                            >
                                                {processImageLoading ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                )
                                                    : (
                                                        <>
                                                            <Camera className="mr-2 h-4 w-4" />
                                                            Extract Details
                                                        </>
                                                    )
                                                }
                                            </Button>
                                        </div>
                                    </div> : (
                                        <div {...getAiRootProps()} className="cursor-pointer hover:bg-gray-50 transition">
                                            <input {...getAiInputRootProps()} />
                                            <div className="flex flex-col items-center">
                                                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                                                <p className="text-gray-600 text-sm">
                                                </p>
                                                <p className="text-gray-500 text-xs mt-1">Supports: JPG, PNG, WebP (max 5MB)</p>
                                            </div>
                                        </div>
                                    )}</div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md">
                                <h3 className="font-medium mb-2">How it Works</h3>
                                <ol className="space-y-2 text-sm text-gray-600 list-decimal pl-4">
                                    <li>Upload a clear image of the car</li>
                                    <li>Click "Extract" to analyse with Gemini AI</li>
                                    <li>Fill in any missing details manually</li>
                                    <li>Add the car to youe inventory</li>
                                </ol>
                            </div>
                            <div className="bg-amber-50 p-4 rounded-md">
                                <h3 className="font-medium text-amber-800 mb-1">Tips for best Result</h3>
                                <ol className="space-y-1 text-sm text-amber-700">
                                    <li>• Use clear, well-lit images</li>
                                    <li>• Try to capture the entire vehicle</li>
                                    <li>• For difficult models, use multiple views</li>
                                    <li>• Always verify AI-exrtracted information</li>
                                </ol>
                            </div>
                        </CardContent>

                    </Card>

                </TabsContent>
            </Tabs>
        </div >
    )
}

export default AddCarForm